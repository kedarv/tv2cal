import Fastify from 'fastify'
import cors from '@fastify/cors'
import axios from 'axios';
import { Sequelize, Model, DataTypes, Op } from 'sequelize';
import ical from "ical-generator";
import { DateTime } from "luxon";
import fastifyEnv from '@fastify/env';

const schema = {
    type: 'object',
    required: ['DB_PATH', 'PORT', 'API_KEY'],
    properties: {
        DB_PATH: {
            type: 'string'
        },
        PORT: {
            type: 'integer',
        },
        API_KEY: {
            type: 'string',
        }
    }
}

const options = {
    confKey: 'config',
    schema,
    dotenv: true,
    data: process.env
}

const fastify = Fastify({
    logger: true
})
await fastify.register(cors)
fastify.register(fastifyEnv, options)
await fastify.after()

const getUnixTimestamp = () => {
    return Math.floor(new Date().getTime() / 1000);
}

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: fastify.config.DB_PATH,
    sync: true
});

const List = sequelize.define('List', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    name: DataTypes.STRING,
    shows: DataTypes.TEXT,
    email: {
        type: DataTypes.STRING,
        get() {
            return undefined;
        }
    }
}, {
    uniqueKeys: {
        Items_unique: {
            fields: ['name']
        }
    }
});

const Show = sequelize.define('Show', {
    name: DataTypes.STRING,
    seasons: DataTypes.TEXT,
    show_id: { type: Sequelize.INTEGER, primaryKey: true },
    updated_at: DataTypes.INTEGER,
});

const Episode = sequelize.define('Episode', {
    name: DataTypes.STRING,
    season_number: DataTypes.INTEGER,
    episode_number: DataTypes.INTEGER,
    show_id: DataTypes.INTEGER,
    air_date: DataTypes.STRING,
    episode_id: { type: Sequelize.INTEGER, primaryKey: true },
});


sequelize.sync();
const BASE_URL = "https://api.themoviedb.org/3/";

fastify.get('/', async (request, reply) => {
    return "it is working";
})

const fetchShows = async (shows) => {
    for (const show of shows) {
        let created = false;
        let queriedShow = await Show.findOne({ where: { show_id: show['id'] } });
        if (queriedShow === null) {
            const res = await axios.get(`${BASE_URL}/tv/${show['id']}`, { params: { api_key: fastify.config.API_KEY } });
            queriedShow = await Show.create({
                name: res.data['name'],
                seasons: res.data['number_of_seasons'],
                show_id: show['id'],
                updated_at: getUnixTimestamp(),
            });
            created = true;
        }

        if (created || getUnixTimestamp() > queriedShow['updated_at'] + 86400) {
            for (let i = 1; i <= queriedShow['seasons']; i++) {
                const seasonRes = await axios.get(`https://api.themoviedb.org/3/tv/${queriedShow['show_id']}/season/${i}`, { params: { api_key: fastify.config.API_KEY } });
                for (const episode of seasonRes.data['episodes']) {
                    const foundEpisode = await Episode.findByPk(episode['id']);
                    if (!foundEpisode) {
                        Episode.create({
                            name: episode['name'],
                            season_number: episode['season_number'],
                            episode_number: episode['episode_number'],
                            show_id: queriedShow['show_id'],
                            air_date: episode["air_date"],
                            episode_id: episode['id'],
                        })
                    }
                }
            }
        }
    }
}

fastify.get('/cal/:id', async (request, reply) => {
    const { id } = request.params;
    const queryRes = await List.findOne({
        where: {
            id: id,
        }
    });
    const shows = JSON.parse(queryRes['shows']);
    await fetchShows(shows);
    const events = await Episode.findAll({
        where: {
            show_id: {
                [Op.or]: shows.map(s => s['id'])
            }
        }
    });

    const allShows = await Show.findAll({
        where: {
            show_id: {
                [Op.or]: shows.map(s => s['id'])
            }
        },
        raw: true,
    });
    const calendar = ical({ name: queryRes['name'] });
    events.filter(event => event.air_date).map(event => {
        calendar.createEvent({
            start: DateTime.fromISO(event['air_date']),
            description: `s${event['season_number']}e${event['episode_number']}`,
            allDay: true,
            summary: `${allShows.find(s => s['show_id'] == event['show_id'])['name']} - ${event['name']}`,
        });
    })
    reply.send(calendar.toString());
})

fastify.get('/lists', async (request, reply) => {
    return await List.findAll();
})

fastify.get('/search', {
    schema: {
        querystring: {
            type: 'object',
            properties: {
                search: {
                    type: 'string'
                },
            },
            required: ['search']
        }
    }
}, async (request, reply) => {
    const res = await axios.get(BASE_URL + "search/tv", { params: { api_key: fastify.config.API_KEY, query: request.query.search } });
    return res.data['results'].filter(result => result['vote_count'] > 10);
});


fastify.post('/create', {
    schema: {
        body: {
            type: 'object',
            required: ['name', 'shows', 'email'],
            properties: {
                name: {
                    type: 'string',
                    maxLength: 50,
                    minLength: 1
                },
                email: {
                    type: 'string',
                    minLength: 1
                },
                shows: {
                    type: 'array',
                    minItems: 1,
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            name: { type: 'string' }
                        }
                    }
                }
            }
        }
    }
}, async (request, reply) => {
    await List.create({
        name: request.body.name,
        shows: JSON.stringify(request.body.shows),
        email: request.body.email,
    });
    await fetchShows(request.body.shows);
    reply.code(200);
})

await fastify.listen({ port: fastify.config.PORT, host: "0.0.0.0" });