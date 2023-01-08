import Fastify from "fastify";
import cors from "@fastify/cors";
import axios from "axios";
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
import prisma from "./prisma.js";

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

fastify.get("/", async (request, reply) => {
  return "tv2cal is running";
});

const fetchShows = async (shows) => {
  for (const show of shows) {
    let created = false;
    let queriedShow = await prisma.Show.findUnique({ where: { show_id: show.id } });
    
    if (queriedShow === null) {
      const res = await axios.get(`${BASE_URL}/tv/${show.id}`, {
        params: { api_key: fastify.config.API_KEY },
      });
      queriedShow = await prisma.Show.create({
        data: {
          name: res.data.name,
          seasons: res.data.number_of_seasons,
          show_id: show.id,
          ended: res.data.status === "Ended",
        }
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
      if (cacheBusted) {
        const res = await axios.get(`${BASE_URL}/tv/${show.id}`, {
          params: { api_key: fastify.config.API_KEY },
        });
        await prisma.user.update({
          where: { show_id: show.id },
          data: {
            seasons: res.data["number_of_seasons"],
            updatedAt: Date.now()
          },
        }); 
      }
      console.log("we in episode fetchin")
      for (let i = 1; i <= seasons; i++) {
        const seasonRes = await axios.get(
          `https://api.themoviedb.org/3/tv/${queriedShow["show_id"]}/season/${i}`,
          { params: { api_key: fastify.config.API_KEY } }
        );
        for (const episode of seasonRes.data["episodes"]) {
          await prisma.Episode.upsert({
            where: {
              show_id: episode["show_id"],
              episode_number: episode["episode_number"],
              season_number: episode["season_number"],
            },
            update: {
              name: episode["name"],
              air_date: episode["air_date"],
              episode_id: episode["id"],
            },
            create: {
              name: episode["name"],
              season_number: episode["season_number"],
              episode_number: episode["episode_number"],
              show_id: queriedShow["show_id"],
              air_date: episode["air_date"],
              episode_id: episode["id"],
            }
          });
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
      unauthedLists: await prisma.List.findMany({
        where: {
          NOT: {
            email: email,
          },
        },
      }),
      authedLists: await prisma.List.findMany({
        where: {
          email: email,
        },
      }),
    };
  }
  return {
    unauthedLists: await prisma.List.findMany({take: 5}),
    authedLists: [],
  };
});

fastify.get("/search", searchSchema, async (request, reply) => {
  const res = await axios.get(BASE_URL + "search/tv", {
    params: { api_key: fastify.config.API_KEY, query: request.query.search },
  });
  return res.data["results"].filter((result) => result["vote_count"] > 10);
});

fastify.post("/create", listCreateSchema, async (request, reply) => {
  // await prisma.List.create({
  //   data: {
  //     name: request.body.name,
  //     shows: JSON.stringify(request.body.shows),
  //     email: request.body.email,
  //   }
  // });
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
