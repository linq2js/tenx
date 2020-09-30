import tenx from "tenx";

export default tenx({
  keyword: "Avenger",
  page: 1,
  computed: {
    // define computed prop presents movie search results
    // this prop fetches data automatically when keyword changed
    results: [
      "keyword",
      "page",
      (keyword, page) => async ({ debounce }) => {
        await debounce(1000);
        if (!keyword) return { results: [] };
        const res = await fetch(
          `https://api.themoviedb.org/3/search/movie?&api_key=04c35731a5ee918f014970082a0088b1&query=${keyword}&page=${page}`
        );
        return await res.json();
      },
    ],
  },
});
