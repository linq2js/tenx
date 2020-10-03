import createState from "../lib/createState";
import { setIn } from "./mutation";
import shallowMemo from "./shallowMemo";

const defaultSelectId = (entity) => entity.id;
const defaultMapper = (entity) => entity;
export default function entitySetState(initial, options = {}) {
  if (typeof options === "function") {
    options = { selectId: options };
  }

  const { selectId = defaultSelectId } = options;

  return function (state) {
    state.value = normalize(initial, selectId);

    return Object.assign(state, {
      get(id, defaultValue) {
        return state.value.entities[id] || defaultValue;
      },
      entity(id) {
        const entity = createState(state.value.entities[id], () => {
          state.update(entity.value);
        });
        return entity;
      },
      swap(a, b) {
        if (a === b) return;
        const newIds = state.value.ids.slice();
        const ai = newIds.indexOf(a);
        const bi = newIds.indexOf(b);
        if (ai === -1 || bi === -1) throw new Error("Invalid entity id");
        newIds[ai] = b;
        newIds[bi] = a;
        state.value = createStateValue(newIds, state.value.entities);
      },
      sort(compareFn) {
        let newIds;
        if (Array.isArray(compareFn)) {
          newIds = compareFn;
        } else {
          newIds = shallowMemo(
            state.value.ids,
            state.value.slice().sort(compareFn)
          );
        }
        if (newIds !== state.value.ids) {
          state.value = createStateValue(newIds, state.value.entities);
        }
      },
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

        if (typeof entities[0] === "function") {
          const predicate = entities[0];
          const filteredIds = newIds.filter((id) => {
            const currentEntity = newEntities[id];
            const newEntity = predicate(currentEntity);
            if (newEntity === false) return false;
            if (typeof newEntity === "object") {
              if (newEntity !== currentEntity) {
                if (newEntities === state.value.entities) {
                  newEntities = { ...newEntities };
                }
                newEntities[id] = newEntity;
              }
            }
            return true;
          });
          if (filteredIds.length !== newIds.length) {
            newIds = filteredIds;
          }
        } else {
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
        }
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
        if (typeof ids[0] === "function") {
          const predicate = ids[0];
          let newEntities = state.value.entities;
          const newIds = state.value.ids.filter((id) => {
            const entity = newEntities[id];
            if (predicate(entity)) {
              if (newEntities === state.value.entities) {
                newEntities = { ...newEntities };
              }
              delete newEntities[id];
              return false;
            }
            return true;
          });
          if (newIds.length === state.value.ids.length) return;
          state.value = createStateValue(newIds, newEntities);
        } else {
          const newIds = state.value.ids.filter((id) => !ids.includes(id));
          // nothing change
          if (newIds.length === state.value.ids.length) return;
          const newEntities = { ...state.value.entities };
          ids.forEach((id) => delete newEntities[id]);
          state.value = createStateValue(newIds, newEntities);
        }
      },
      array() {
        return state.value.array(...arguments);
      },
      map() {
        return state.value.map(...arguments);
      },
      reduce() {
        return state.value.reduce(...arguments);
      },
    });
  };
}

function normalize(value = [], selectId) {
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
  const result = {
    ids,
    entities,
  };

  Object.entries({
    map(mapper = defaultMapper, filter) {
      if (typeof mapper !== "function") {
        const prop = mapper;
        mapper = (entity) => entity[prop];
      }
      if (typeof filter !== "function" && typeof filter !== "undefined") {
        const prop = filter;
        filter = (entity) => entity[prop];
      }
      return ids.reduce((seed, id) => {
        const entity = entities[id];
        if (!filter || filter(entity)) {
          seed[id] = mapper(entity);
        }
        return seed;
      }, {});
    },
    array(mapper = defaultMapper, filter) {
      if (typeof mapper !== "function") {
        const prop = mapper;
        mapper = (entity) => entity[prop];
      }
      if (typeof filter !== "function" && typeof filter !== "undefined") {
        const prop = filter;
        filter = (entity) => entity[prop];
      }
      return ids.reduce((seed, id) => {
        const entity = entities[id];
        if (!filter || filter(entity)) {
          seed.push(mapper(entity));
        }
        return seed;
      }, []);
    },
    reduce(reducer, seed) {
      if (arguments.length > 1) {
        return ids.reduce((seed, id) => reducer(seed, entities[id]), seed);
      }
      return ids.reduce((seed, id) => reducer(seed, entities[id]));
    },
  }).forEach(([key, value]) => {
    Object.defineProperty(result, key, { value, enumerable: false });
  });

  return result;
}
