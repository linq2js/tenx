import createArrayKeyedMap from "../lib/createArrayKeyedMap";
import { setIn } from "./mutation";

const defaultSelectId = (entity) => entity.id;
const defaultMapper = (entity) => entity;
export default function entitySetState(initial, options = {}) {
  if (typeof options === "function") {
    options = { selectId: options };
  }

  const { selectId = defaultSelectId } = options;

  function toArray(ids, entities, mapper = defaultMapper) {
    if (typeof mapper === "string") {
      const prop = mapper;
      mapper = (entity) => entity[prop];
    }
    return ids.map((id) => mapper(entities[id]));
  }

  function toMap(ids, entities, mapper) {
    if (typeof mapper === "string") {
      const prop = mapper;
      mapper = (entity) => entity[prop];
    }
    return ids.reduce((obj, id) => {
      obj[id] = mapper(entities[id]);
      return obj;
    }, {});
  }

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
    const cache = createArrayKeyedMap();
    const result = {
      ids,
      entities,
    };

    Object.defineProperties(result, {
      toArray: {
        value(mapper) {
          return cache.getOrAdd(["array", mapper], () =>
            toArray(ids, entities, mapper)
          );
        },
        enumerable: false,
      },
      toMap: {
        value(mapper) {
          return cache.getOrAdd(["map", mapper], () =>
            toMap(ids, entities, mapper)
          );
        },
        enumerable: false,
      },
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
      map(mapper = defaultMapper) {
        return state.value.ids.map((id) => mapper(state.value.entities[id]));
      },
      remove(...ids) {
        if (typeof ids[0] === "function") {
          const predicate = ids[0];
          let newEntities = state.value.entities;
          const newIds = ids.filter((id) => {
            const entity = state.value.entities[id];
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
      toArray(mapper) {
        return state.value.toArray(mapper);
      },
      toMap(mapper) {
        return state.value.toMap(mapper);
      },
    });
  };
}
