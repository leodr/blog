const chokidar = require("chokidar");
const {
  readFileSync,
  writeFileSync,
  copyFileSync,
  mkdirSync,
  rmSync,
} = require("fs");
const md = require("markdown-it")();
const glob = require("fast-glob");

clearDirectory();
buildSite();

const shouldWatch = process.argv.includes("--watch");

if (shouldWatch) {
  chokidar.watch(["./posts", "./templates", "./static"]).on("all", (event) => {
    buildSite();
  });
}

function buildSite() {
  const time = Date.now();
  console.log("Building site...");

  copyStaticFiles();

  const posts = getPosts();

  writePosts(posts);

  writeHomePage(posts);

  console.log(`Site built in ${Date.now() - time}ms.\n`);
}

function writeHomePage(posts) {
  const homeTemplate = readFileSync("./templates/home.html", {
    encoding: "utf-8",
  });

  let list = "";

  for (const post of posts) {
    const h1 = post.html.match(/<h1.*?>(.*?)<\/h1>/)?.[1];

    list += `<li>
      <a href="./${post.slug}.html">${h1}</a>
    </li>`;
  }

  const interpolatedHtml = homeTemplate.replace("{{ posts }}", list);

  writeFileSync(`./out/index.html`, interpolatedHtml);
}

function writePosts(posts) {
  const postTemplate = readFileSync("./templates/post.html", {
    encoding: "utf-8",
  });

  for (const post of posts) {
    const interpolatedHtml = postTemplate.replace("{{ content }}", post.html);

    writeFileSync(`./out/${post.slug}.html`, interpolatedHtml);
  }
}

function copyStaticFiles() {
  const staticFiles = glob.sync("./static/**/*.*", {
    absolute: true,
    objectMode: true,
  });

  for (const file of staticFiles) {
    copyFileSync(file.path, file.path.replace("static", "out"));
  }
}

function clearDirectory() {
  rmSync("./out", { recursive: true, force: true });
  mkdirSync("./out");
}

function getPosts() {
  const posts = [];

  for (const file of glob.sync("./posts/**/*.md", {
    absolute: true,
    objectMode: true,
  })) {
    const fileContent = readFileSync(file.path, { encoding: "utf-8" });

    posts.push({
      slug: file.name.replace(".md", ""),
      content: fileContent,
      html: md.render(fileContent),
    });
  }

  return posts;
}
