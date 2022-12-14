import Fastify from "fastify";
import cors from "@fastify/cors";
import axios from "axios";
import { Sequelize, DataTypes, Op } from "sequelize";
import ical from "ical-generator";
import fastifyEnv from "@fastify/env";
import {
  listCreateSchema,
  listDeleteSchema,
  searchSchema,
  listUpdateSchema,
  markAsWatchedSchema,
  markAllAsWatchedSchema,
} from "./schema.js";
import { validateEmail, BASE_URL } from "./utils.js";
import { DateTime } from "luxon";

const options = {
  confKey: "config",
  schema: {
    type: "object",
    required: ["DB_PATH", "PORT", "API_KEY"],
    properties: {
      DB_PATH: {
        type: "string",
      },
      PORT: {
        type: "integer",
      },
      API_KEY: {
        type: "string",
      },
    },
  },
  dotenv: true,
  data: process.env,
};

const fastify = Fastify({
  logger: true,
});
await fastify.register(cors);
fastify.register(fastifyEnv, options);
await fastify.after();

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: fastify.config.DB_PATH,
  sync: true,
  logging: false,
});

const List = sequelize.define(
  "List",
  {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    shows: DataTypes.TEXT,
    email: DataTypes.STRING,
  },
  {
    uniqueKeys: {
      Items_unique: {
        fields: ["name", "email"],
      },
    },
    defaultScope: {
      attributes: { exclude: ["email"] },
    },
  }
);

const Show = sequelize.define("Show", {
  name: DataTypes.STRING,
  seasons: DataTypes.TEXT,
  show_id: { type: Sequelize.INTEGER, primaryKey: true },
  ended: DataTypes.BOOLEAN,
});

const Episode = sequelize.define("Episode", {
  name: DataTypes.STRING,
  season_number: DataTypes.INTEGER,
  episode_number: DataTypes.INTEGER,
  show_id: DataTypes.INTEGER,
  air_date: DataTypes.STRING,
  episode_id: { type: Sequelize.INTEGER, primaryKey: true },
  aired: {
    type: DataTypes.VIRTUAL,
    get() {
      return (
        !!this.air_date &&
        DateTime.now() >=
          DateTime.fromISO(this.air_date, {
            zone: "America/Los_Angeles",
          })
      );
    },
    set(value) {
      throw new Error("not settable");
    },
  },
});

const WatchedEpisodes = sequelize.define(
  "WatchedEpisodes",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    list_id: {
      type: Sequelize.UUID,
      references: {
        model: List,
        key: "id",
      },
      unique: "compositeIndex",
    },
    episode_id: {
      type: Sequelize.INTEGER,
      references: {
        model: Episode,
        key: "episode_id",
      },
      unique: "compositeIndex",
    },
  },
  {
    defaultScope: {
      attributes: { exclude: ["id"] },
    },
  }
);

Episode.hasMany(WatchedEpisodes, { foreignKey: "episode_id" });
List.hasMany(WatchedEpisodes, { foreignKey: "list_id" });
WatchedEpisodes.belongsTo(Episode, { foreignKey: "episode_id" });
WatchedEpisodes.belongsTo(List, { foreignKey: "list_id" });

sequelize.sync();

fastify.get("/", async (request, reply) => {
  return "tv2cal is running";
});

const fetchShows = async (shows) => {
  for (const show of shows) {
    let created = false;
    let queriedShow = await Show.findOne({ where: { show_id: show.id } });
    if (queriedShow === null) {
      const res = await axios.get(`${BASE_URL}/tv/${show.id}`, {
        params: { api_key: fastify.config.API_KEY },
      });
      queriedShow = await Show.create({
        name: res.data.name,
        seasons: res.data.number_of_seasons,
        show_id: show.id,
        ended: res.data.status === "Ended",
      });
      created = true;
    }
    const showUpdatedAtWithCacheTime = DateTime.fromJSDate(
      queriedShow.updatedAt,
      {
        zone: "America/Los_Angeles",
      }
    ).plus({ hours: 6 });
    const cacheBusted =
      DateTime.now({ zone: "America/Los_Angeles" }) >
      showUpdatedAtWithCacheTime;
    if (created || cacheBusted) {
      let seasons = queriedShow.seasons;
      queriedShow.changed("updatedAt", true);

      if (cacheBusted) {
        const res = await axios.get(`${BASE_URL}/tv/${show.id}`, {
          params: { api_key: fastify.config.API_KEY },
        });
        if (queriedShow["seasons"] != res.data["number_of_seasons"]) {
          queriedShow["seasons"] = res.data["number_of_seasons"];
          seasons = res.data["number_of_seasons"];
        }
      }
      queriedShow.save({ silent: false });
      for (let i = 1; i <= seasons; i++) {
        const seasonRes = await axios.get(
          `https://api.themoviedb.org/3/tv/${queriedShow["show_id"]}/season/${i}`,
          { params: { api_key: fastify.config.API_KEY } }
        );
        for (const episode of seasonRes.data["episodes"]) {
          const foundEpisode = await Episode.findOne({
            where: {
              show_id: episode["show_id"],
              episode_number: episode["episode_number"],
              season_number: episode["season_number"],
            },
          });
          if (!foundEpisode) {
            Episode.create({
              name: episode["name"],
              season_number: episode["season_number"],
              episode_number: episode["episode_number"],
              show_id: queriedShow["show_id"],
              air_date: episode["air_date"],
              episode_id: episode["id"],
            });
          } else {
            // TODO: find a more elegant way to create or update
            foundEpisode["air_date"] = episode["air_date"];
            foundEpisode["name"] = episode["name"];
            foundEpisode["episode_id"] = episode["id"];
            // luckily, sequelize will transparently do nothing if there
            // is nothing to save
            foundEpisode.save();
          }
        }
      }
    }
  }
};

const getEpisodesByList = async (id, update) => {
  const queryRes = await List.findOne({
    where: {
      id: id,
    },
  });
  const shows = JSON.parse(queryRes["shows"]);
  if (update) {
    await fetchShows(shows);
  }
  const events = await Episode.findAll({
    where: {
      show_id: {
        [Op.or]: shows.map((s) => s["id"]),
      },
    },
    include: {
      model: WatchedEpisodes,
      attributes: ["updatedAt"],
    },
  });
  return { events, shows, listName: queryRes["name"] };
};

fastify.get("/cal/:id", async (request, reply) => {
  const { id } = request.params;
  const { events, shows, listName } = await getEpisodesByList(id, true);
  const allShows = await Show.findAll({
    where: {
      show_id: {
        [Op.or]: shows.map((s) => s["id"]),
      },
    },
    raw: true,
  });
  const calendar = ical({ name: listName });
  events
    .filter((event) => event.air_date)
    .map((event) => {
      calendar.createEvent({
        start: DateTime.fromISO(event["air_date"]),
        description: {
          plain: `s${event["season_number"]}e${event["episode_number"]}`,
          html: `s${event["season_number"]}e${event["episode_number"]}`,
        },
        allDay: true,
        summary: `${
          allShows.find((s) => s["show_id"] == event["show_id"])["name"]
        } - ${event["name"]}`,
      });
    });
  reply.send(calendar.toString());
});

fastify.get("/lists", async (request, reply) => {
  const email = request?.query?.email;
  if (email) {
    return {
      unauthedLists: await List.findAll({
        where: {
          email: {
            [Op.ne]: email,
          },
        },
      }),
      authedLists: await List.findAll({
        where: {
          email: email,
        },
      }),
    };
  }
  return {
    unauthedLists: await List.findAll(),
    authedLists: [],
  };
});

fastify.get("/search", searchSchema, async (request, reply) => {
  const res = await axios.get(BASE_URL + "search/tv", {
    params: { api_key: fastify.config.API_KEY, query: request.query.search },
  });
  return res.data["results"]
    .sort((resultA, resultB) => resultB["vote_count"] - resultA["vote_count"])
    .filter((result) => result["vote_count"] > 2);
});

fastify.post("/create", listCreateSchema, async (request, reply) => {
  await List.create({
    name: request.body.name,
    shows: JSON.stringify(request.body.shows),
    email: request.body.email,
  });
  await fetchShows(request.body.shows);
  reply.code(200);
});

fastify.post("/update", listUpdateSchema, async (request, reply) => {
  const list = await List.unscoped().findOne({
    where: { id: request.body.id },
  });
  await validateEmail(list, request.body.email);
  list.name = request.body.name;
  list.shows = JSON.stringify(request.body.shows);
  await list.save();
  await fetchShows(request.body.shows);
  reply.code(200);
});

fastify.post("/delete", listDeleteSchema, async (request, reply) => {
  const list = await List.unscoped().findOne({
    where: { id: request.body.id },
  });
  await validateEmail(list, request.body.email);
  await list.destroy();
  reply.code(200);
});

fastify.get("/list/:id", async (request, reply) => {
  const { id } = request.params;
  const { events } = await getEpisodesByList(id, false);
  const watched = await WatchedEpisodes.findAll({
    where: { list_id: id },
  });
  reply.send({
    events: events.filter((event) => event.air_date),
    watched,
  });
});

fastify.post("/markAsWatched", markAsWatchedSchema, async (request, reply) => {
  const list = await List.unscoped().findOne({
    where: { email: request.body.email },
  });
  const listId = list.id;

  const episode = await Episode.findOne({
    where: { episode_id: request.body.episodeId },
  });

  if (!episode) {
    return reply.code(400).send({ message: "episode does not exist" });
  } else if (!episode.aired || !episode.air_date) {
    return reply
      .code(400)
      .send({ message: "cannot mark unaired episode as watched" });
  }

  const existingRecord = await WatchedEpisodes.unscoped().findOne({
    where: { list_id: listId, episode_id: request.body.episodeId },
  });
  if (existingRecord) {
    await existingRecord.destroy({ force: true });
  } else {
    await WatchedEpisodes.create({
      episode_id: request.body.episodeId,
      list_id: listId,
    });
  }
  reply.send(
    await WatchedEpisodes.findAll({
      where: { list_id: listId },
    })
  );
});

fastify.post(
  "/markAllAsWatched",
  markAllAsWatchedSchema,
  async (request, reply) => {
    const list = await List.unscoped().findOne({
      where: { email: request.body.email },
    });
    const listId = list.id;
    const shows = JSON.parse(list.shows);
    if (!shows.find((show) => show.id == request.body.showId)) {
      reply.code(500);
    }

    const watched = (
      await WatchedEpisodes.findAll({
        where: { list_id: listId },
        attributes: ["episode_id"],
        raw: true,
      })
    ).map((e) => e.episode_id);

    const episodes = await Episode.findAll({
      where: {
        show_id: request.body.showId,
        episode_id: { [Op.notIn]: watched },
        air_date: {
          [Op.ne]: null,
        },
      },
    });

    for (const episode of episodes) {
      // We can't access virtual fields in the initial query
      // Check aired property here instead as a workaround
      if (episode.aired) {
        await WatchedEpisodes.create({
          episode_id: episode.episode_id,
          list_id: listId,
        });
      }
    }

    reply.send(
      await WatchedEpisodes.findAll({
        where: { list_id: listId },
      })
    );
  }
);

await fastify.listen({ port: fastify.config.PORT, host: "0.0.0.0" });
