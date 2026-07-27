import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "./index";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo — MenuAtlas" },
      {
        name: "description",
        content:
          "Experimente o cardápio digital MenuAtlas em uma demonstração interativa completa.",
      },
      { property: "og:title", content: "Demo — MenuAtlas" },
      {
        property: "og:description",
        content: "Cardápio digital de demonstração do MenuAtlas.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HomePage,
});
