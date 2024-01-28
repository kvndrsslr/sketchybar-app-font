import chokidar from "chokidar";
import { install } from "./install.js";

install(process.argv[2]);
chokidar.watch(["./mappings", "./svgs"]).on("change", (event, path) => {
    install(process.argv[2]);
});
