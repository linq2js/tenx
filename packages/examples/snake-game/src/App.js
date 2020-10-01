import React, { useEffect } from "react";
import "./App.css";
import tenx from "tenx";
import { useStore } from "tenx/react";

const rows = 21;
const columns = 41;
const speed = 150;
const cellSize = 16;
let emptyCells = {};
// actions
const Start = () => {};
const Move = () => {};
const Pause = () => {};
const store = tenx(
  {
    // no food
    food: [-1, -1],
    snake: [],
    gameOver: "",
  },
  {
    init({ dispatch }) {
      dispatch(GameSaga);
    },
  }
);
const moves = {
  up: (pos) => [pos[0], pos[1] - 1],
  down: (pos) => [pos[0], pos[1] + 1],
  left: (pos) => [pos[0] - 1, pos[1]],
  right: (pos) => [pos[0] + 1, pos[1]],
};
const generateFood = () => {
  const values = Object.values(emptyCells);
  return values[Math.floor(Math.random() * values.length)];
};
const removeEmptyCell = ([x, y]) => delete emptyCells[`${x}_${y}`];
const useSnakeStore = function (selector) {
  return useStore(store, selector);
};

function* GameSaga({ snake, food, when, delay, gameOver }) {
  // game loop
  while (true) {
    // wait for game start
    yield when(Start);
    gameOver.value = "";
    console.log("game-start");
    let direction = "up";
    // at beginning, the snake is center of the screen
    snake.value = [[Math.floor(rows / 2), Math.floor(columns / 2)]];
    emptyCells = {};
    // reset empty cells
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        emptyCells[`${x}_${y}`] = [x, y];
      }
    }
    // mark the snake position is not free
    removeEmptyCell(snake.value[0]);
    food.value = generateFood(emptyCells);

    while (true) {
      const { move, pause } = yield {
        tick: delay(speed),
        move: when(Move),
        pause: when(Pause),
      };

      if (pause) {
        // wait until pause dispatched again
        yield when(Pause);
        continue;
      }

      if (move) {
        direction = move.payload;
        continue;
      }

      // move snake toward
      const copyOfSnake = snake.value.slice();
      const [x, y] = moves[direction](copyOfSnake[0]);
      // invalid move
      if (x < 0 || x >= columns || y < 0 || y >= rows) {
        gameOver.value = `Game Over. Your score: ${snake.value.length}. Press SPACE to play again ?`;
        break;
      }
      // append head
      copyOfSnake.unshift([x, y]);
      // the snake eats the food
      if (food.value[0] === x && food.value[1] === y) {
        // dont need to remove tail
        // generate new food
        food.value = generateFood();
      } else {
        // when snake head moves to new position, we remove snake tail
        const tail = copyOfSnake.pop();
        removeEmptyCell(tail);
      }
      snake.value = copyOfSnake;
    }
  }
}

function App() {
  const { snake, food, start, gameOver, handleKeyUp } = useSnakeStore(
    (state, { callback, dispatch }) => {
      const move = dispatch.get(Move);

      return {
        gameOver: state.gameOver,
        snake: state.snake,
        food: state.food,
        start: dispatch.get(Start),
        handleKeyUp: callback(
          (e) => {
            switch (e.keyCode) {
              case 38:
                move("up");
                break;
              case 37:
                move("left");
                break;
              case 39:
                move("right");
                break;
              case 40:
                move("down");
                break;
              case 32:
                dispatch(state.gameOver ? Start : Pause);
                break;
            }
          },
          // indicate the callback should depend on gameOver value
          state.gameOver
        ),
      };
    }
  );
  // handle key pressing
  useEffect(() => {
    const handler = handleKeyUp;
    document.addEventListener("keyup", handler);
    return function () {
      document.removeEventListener("keyup", handler);
    };
  }, [handleKeyUp]);

  // auto start
  useEffect(() => {
    start();
  }, [start]);

  return (
    <div className="App">
      {gameOver ? (
        <p className="message">{gameOver}</p>
      ) : (
        <p className="message">
          Press SPACE to pause and unpause game. Press{" "}
          <span role="img" aria-label="Directions">
            ⬆ ️⬇ ️⬅ ️➡
          </span>{" "}
          to move the snake️
        </p>
      )}
      <div
        className="board"
        style={{ width: columns * cellSize, height: rows * cellSize }}
      >
        {/* render snake */}
        {snake.map((pos, index) => (
          <div
            key={index}
            className={"snake " + (index === 0 && "head")}
            style={{ left: pos[0] * cellSize, top: pos[1] * cellSize }}
          />
        ))}
        {/* render food */}
        <div
          className="food"
          style={{ left: food[0] * cellSize, top: food[1] * cellSize }}
        />
      </div>
    </div>
  );
}

export default App;
