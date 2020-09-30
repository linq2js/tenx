import tenx from "tenx";
import { cancellable, delay } from "tenx/extras";

export default tenx({
  keyword: "Avenger",
  page: 1,
  computed: {
    // define computed prop presents movie search results
    // this prop fetches data automatically when keyword changed
    results: [
      "keyword",
      "page",
      (keyword, page) => {
        if (!keyword) return { results: [] };

        return cancellable(async (last) => {
          last && last.cancel();
          await delay(1500);
          const results = await fetch(
            `https://api.themoviedb.org/3/search/movie?&api_key=04c35731a5ee918f014970082a0088b1&query=${encodeURIComponent(
              keyword
            )}&page=${page}`
          ).then((res) => res.json());

          return results;
        });
      }
    ]
  }
});
