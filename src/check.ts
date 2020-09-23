import tenx from "./index";

async function saga() {
  const allResults = await tenx(["acb"]);
  const raceResult = await tenx({ cancel: "cancel" });
  tenx(["abc"], (a) => console.log(a.length));
  tenx({ cancel: "cancel" }, (a) => console.log(a.cancel.payload));
  tenx("action", undefined);
  tenx("action", (a) => {
    console.log(a.payload);
  });
  console.log(allResults, raceResult.cancel.payload);
}

console.log(saga);
