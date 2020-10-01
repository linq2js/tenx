import { setIn } from "./mutation";

const defaultSelectId = (entity) => entity.id;
export default function entitySetState(initial, options = {}) {
  if (typeof options === "function") {
    options = { selectId: options };
  }

  const { selectId = defaultSelectId } = options;

  function normalize(value = []) {
    const ids = [];
    const entities = {};
    value.forEach((entity) => {
      const id = selectId(entity);
      if (typeof id === "undefined") return;
      ids.push(id);
      entities[id] = entity;
    });
    return createStateValue(ids, entities);
  }

  function createStateValue(ids, entities) {
    let array;
    const result = {
      ids,
      entities,
    };

    Object.defineProperty(result, "toArray", {
      value() {
        if (!array) {
          array = ids.map((id) => entities[id]);
        }
        return array;
      },
      enumerable: false,
    });

    return result;
  }

  return function (state) {
    state.value = normalize(initial);

    return Object.assign(state, {
      updateIn(...entities) {
        let newEntities = state.value.entities;
        let newIds = state.value.ids;
        entities.forEach((entity) => {
          const id = selectId(entity);
          if (typeof id === "undefined") return;
          // new entity
          if (!(id in newEntities)) {
            if (newIds === state.value.ids) {
              newIds = newIds.slice();
            }
            newIds.push(id);
          }
          let newEntity = newEntities[id];
          Object.entries(entity).forEach(([prop, value]) => {
            newEntity = setIn(newEntity, prop.split("."), value);
          });
          if (newEntity !== newEntities) {
            if (newEntities === state.value.entities) {
              newEntities = { ...newEntities };
            }
            newEntities[id] = newEntity;
          }
        });
        if (
          newIds !== state.value.ids ||
          newEntities !== state.value.entities
        ) {
          state.value = createStateValue(newIds, newEntities);
        }
      },
      update(...entities) {
        let newEntities = state.value.entities;
        let newIds = state.value.ids;
        entities.forEach((entity) => {
          const id = selectId(entity);
          if (typeof id === "undefined") return;
          // new entity
          if (!(id in newEntities)) {
            if (newIds === state.value.ids) {
              newIds = newIds.slice();
            }
            newIds.push(id);
          }
          if (newEntities === state.value.entities) {
            newEntities = { ...newEntities };
          }
          newEntities[id] = entity;
        });
        if (
          newIds !== state.value.ids ||
          newEntities !== state.value.entities
        ) {
          state.value = createStateValue(newIds, newEntities);
        }
      },
      merge(...entities) {
        let newEntities = state.value.entities;
        entities.forEach((entity) => {
          const id = selectId(entity);
          if (typeof id === "undefined") return;
          let newEntity = newEntities[id];
          let entityChanged = false;
          Object.entries(entity).forEach(([prop, value]) => {
            if (value === newEntity[prop]) return;
            entityChanged = true;
            if (newEntity === newEntities[id]) {
              newEntity = { ...newEntity };
            }
            newEntity[prop] = value;
          });
          if (entityChanged) {
            if (newEntities === state.value.entities) {
              newEntities = { ...newEntities };
            }
            newEntities[id] = newEntity;
          }
        });
        if (newEntities !== state.value.entities) {
          state.value = createStateValue(state.value.ids, newEntities);
        }
      },
      remove(...ids) {
        const newIds = state.value.ids.filter((id) => !ids.includes(id));
        // nothing change
        if (newIds.length === state.value.ids.length) return;
        const newEntities = { ...state.value.entities };
        ids.forEach((id) => delete newEntities[id]);
        state.value = createStateValue(newIds, newEntities);
      },
    });
  };
}
