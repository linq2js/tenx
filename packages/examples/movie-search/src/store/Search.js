export default function Search({ keyword, page }, payload) {
  keyword.value = payload;
  page.value = 1;
}
