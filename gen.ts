import { emptyDirSync } from "https://deno.land/std@0.117.0/fs/empty_dir.ts";
import { copySync } from "https://deno.land/std@0.117.0/fs/copy.ts";
import { expandGlobSync } from "https://deno.land/std@0.117.0/fs/expand_glob.ts";
import { marked } from "https://esm.sh/marked@4.0.7";
import { parse } from "https://deno.land/std@0.117.0/flags/mod.ts";

clearDirectory();
buildSite();

const args = parse(Deno.args, { boolean: true });

if (args.watch) {
  const watcher = Deno.watchFs(["./posts", "./templates", "./static"]);

  for await (const event of watcher) {
    if (["create", "modify", "remove"].includes(event.kind)) {
      buildSite();
    }
  }
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

function writeHomePage(posts: Post[]) {
  const homeTemplate = Deno.readTextFileSync("./templates/home.html");

  let list = "";

  for (const post of posts) {
    const html = marked.parse(post.content);

    const h1 = html.match(/<h1.*?>(.*?)<\/h1>/)?.[1];

    list += `<li>
      <a href="./${post.slug}.html">${h1}</a>
    </li>`;
  }

  const interpolatedHtml = homeTemplate.replace("{{ posts }}", list);

  Deno.writeTextFileSync(`./out/index.html`, interpolatedHtml);
}

function writePosts(posts: Post[]) {
  const postTemplate = Deno.readTextFileSync("./templates/post.html");

  for (const post of posts) {
    const html = marked.parse(post.content);

    const interpolatedHtml = postTemplate.replace("{{ content }}", html);

    Deno.writeTextFileSync(`./out/${post.slug}.html`, interpolatedHtml);
  }
}

function copyStaticFiles() {
  for (const file of expandGlobSync("./static/**/*.*")) {
    copySync(file.path, file.path.replace("static", "out"), {
      overwrite: true,
    });
  }
}

function clearDirectory() {
  emptyDirSync("./out");
}

type Post = {
  slug: string;
  content: string;
  html: string;
};

function getPosts() {
  const posts: Post[] = [];

  for (const file of expandGlobSync("./posts/**/*.md")) {
    const fileContent = Deno.readTextFileSync(file.path);

    posts.push({
      slug: file.name.replace(".md", ""),
      content: fileContent,
      html: marked.parse(fileContent),
    });
  }

  return posts;
}
