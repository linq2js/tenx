export default function Prev({ page }) {
  page.value = Math.max(page.value - 1, 1);
}
