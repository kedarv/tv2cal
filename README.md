# tv2cal

allows users to add tv show schedules to their calendars: https://tv2cal.kedarv.com

### backend
[fastify](https://www.fastify.io/) and sqlite, running on [fly.io](https://fly.io/) on [production](https://tv2cal.kedarv.com/).

to run, create a `.env` file and fill in the `PORT`, `DB_PATH`, `API_KEY` fields (api v3 from [themoviedb](https://www.themoviedb.org/). then, run `npm start`

### frontend
[react](https://reactjs.org/) built with [Vite](https://vitejs.dev/), running on [netlify](https://www.netlify.com/) on [production](https://tv2cal.kedarv.com/)

to run, create a `.env` file and fill in the `VITE_API_HOST` field (ie. the url produced from running the backend). then, run `npm start dev`
