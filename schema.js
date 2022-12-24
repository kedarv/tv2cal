const listCreateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["name", "shows", "email"],
      properties: {
        name: {
          type: "string",
          maxLength: 50,
          minLength: 1,
        },
        email: {
          type: "string",
          minLength: 1,
        },
        shows: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
            },
          },
        },
      },
    },
  },
};

const listDeleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["email", "id"],
      properties: {
        id: {
          type: "string",
        },
        email: {
          type: "string",
          minLength: 1,
        },
      },
    },
  },
};

const searchSchema = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        search: {
          type: "string",
        },
      },
      required: ["search"],
    },
  },
};

const listUpdateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["name", "shows", "email", "id"],
      properties: {
        id: {
          type: "string",
        },
        name: {
          type: "string",
          maxLength: 50,
          minLength: 1,
        },
        email: {
          type: "string",
          minLength: 1,
        },
        shows: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
            },
          },
        },
      },
    },
  },
};

const markAsWatchedSchema = {
  schema: {
    body: {
      type: "object",
      required: ["episodeId", "email"],
      properties: {
        email: {
          type: "string",
          minLength: 1,
        },
        episodeId: {
          type: "integer",
        },
      },
    },
  },
};

const markAllAsWatchedSchema = {
  schema: {
    body: {
      type: "object",
      required: ["showId", "email"],
      properties: {
        showId: {
          type: "string",
        },
        email: {
          type: "string",
          minLength: 1,
        },
      },
    },
  },
};

export {
  listCreateSchema,
  listUpdateSchema,
  listDeleteSchema,
  searchSchema,
  markAsWatchedSchema,
  markAllAsWatchedSchema,
};
