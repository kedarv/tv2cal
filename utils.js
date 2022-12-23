const validateEmail = async (list, email) => {
  if (list.email !== email) {
    const err = new Error();
    err.statusCode = 403;
    err.message = "email did not match records";
    throw err;
  }
};

const BASE_URL = "https://api.themoviedb.org/3/";

export { validateEmail, BASE_URL };
