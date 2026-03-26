import app from "./app.js";

const port = 5000;

const bootStrap = async () => {
  try {
    app.listen(port, () => {
      console.log("This server is running on the port :", port);
    });
  } catch (error) {
    console.error(error);
  }
};

bootStrap();
