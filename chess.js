var Chess = function() {

  const NUM_ROWS = 8;
  const NUM_COLS = 8;
  
  var Piece = class Piece {
    constructor(type, color) {
      this.type = type;
      this.color = color;
    }
  };

  var ColorEnum = {
    WHITE: 0,
    BLACK: 1,
    properties: {
      0: {
        name: "white", 
        PAWN_START_ROW: 6, 
        PAWN_DIRECTION: -1, // up 
        value: 0
      },
      1: {
        name: "black", 
        PAWN_START_ROW: 1, 
        PAWN_DIRECTION: 1, // down
        value: 1
      }
    }
  };

  var PieceTypeEnum = {
    PAWN: 0,
    KNIGHT: 1,
    BISHOP: 2,
    ROOK: 3,
    QUEEN: 4,
    KING: 5,
    properties: {
      0: {
        name: "pawn", 
        value: 0,
        findValidMoves: function(position, board) {
          let validMoves = [];
          const color = board[position].color;
          
          const coordinatesMove = [
            // move foward one square
            [1 * ColorEnum.properties[color].PAWN_DIRECTION, 0]
          ];
          if (this.inStartRow(position, board)) {
            // move foward two squares if in start row
            coordinatesMove.push(
              [2 * ColorEnum.properties[color].PAWN_DIRECTION, 0]
            );
          }
          validMoves = validMoves.concat(
            findSquaresAtCoordinates(coordinatesMove, position)
              .filter(s => !board[s]));

          const coordinatesAttack = [
            // can attack forward left and forward right if square occupied by opponent
            [1 * ColorEnum.properties[color].PAWN_DIRECTION, -1],
            [1 * ColorEnum.properties[color].PAWN_DIRECTION, 1],
          ]
          validMoves = validMoves.concat(
            findSquaresAtCoordinates(coordinatesAttack, position, board)
              .filter(s => board[s] && board[s].color !== color));

          return validMoves;
        }, 
        inStartRow: function(position, board) {
          const color = board[position].color;
          return ColorEnum.properties[color].PAWN_START_ROW === findRow(position);
        },
      },
      1: {
        name: "knight", 
        value: 1,
        coordinates: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [2, -1], [2, 1], [1, -2], [1, 2]],
        findValidMoves: function(position, board) {
          return findValidMovesAtCoordinates(this.coordinates, position, board)
        }, 
      },
      2: {
        name: "bishop", 
        value: 2,
        directions: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
        findValidMoves: function(position, board) {
          return findValidMovesInDirection(this.directions, position, board);
        }, 
      },
      3: {
        name: "rook", 
        value: 3,
        directions: [[-1, 0], [1, 0], [0, -1], [0, 1]],
        findValidMoves: function(position, board) {
          return findValidMovesInDirection(this.directions, position, board);
        }, 
      },
      4: {
        name: "queen", 
        value: 4,
        directions: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
        findValidMoves: function(position, board) {
          return findValidMovesInDirection(this.directions, position, board);
        }, 
      },
      5: {
        name: "king", 
        value: 5,
        coordinates: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
        findValidMoves: function(position, board) {
          return findValidMovesAtCoordinates(this.coordinates, position, board)
            .filter(newPosition => !willResultInCheck(position, newPosition, board[position.color], board.slice()));
        }, 
        findPossibleMoves: function(position) {
          return findSquaresAtCoordinates(this.coordinates, position);
        },
      }
    }
  };

  function findValidMovesInDirection(directions, position, board) {
    return directions
      .map(d => findSquaresInDirection(position, d[0], d[1]))
      .map(squares => filterValidSquaresInDirection(squares, board, board[position].color))
      .reduce((a, b) => a.concat(b));
  }

  function findSquaresInDirection(position, rows, cols) {
    const squares = [];
    let i = calculateNewPosition(position, rows, cols);
    while (i !== null) {
      squares.push(i);
      i = calculateNewPosition(i, rows, cols);
    }
    return squares;
  }

  function filterValidSquaresInDirection(squares, board, color) {
    const validSquares = [];
    for (let i = 0; i < squares.length; i++) {
      let s = squares[i];
      if (isValidSquare(board[s], color)) {
        validSquares.push(s);
      }
      // if square is occupied, no further squares to consider; exit iteration
      if (board[s]) {
        break;
      }
    }
    return validSquares
  }

  function findValidMovesAtCoordinates(coordinates, position, board) {
    return findSquaresAtCoordinates(coordinates, position)
      .filter(s => isValidSquare(board[s], board[position].color));
  }

  function findSquaresAtCoordinates(coordinates, position) {
    return coordinates
      .map(c => calculateNewPosition(position, c[0], c[1]))
      .filter(s => s);
  }

  function isValidSquare(square, color) {
    return !square || square.color !== color;
  }

  function findRow(position) {
    return Math.floor(position / NUM_ROWS);
  }

  function findCol(position) {
    return position % NUM_ROWS;
  }

  // may return null
  function calculateNewPosition(oldPosition, rows, cols) {
    const oldRow = findRow(oldPosition);
    const oldCol = findCol(oldPosition);
    const newRow = oldRow + rows;
    const newCol = oldCol + cols;
    if (newRow < 0 || newRow >= NUM_ROWS || newCol < 0 || newCol >= NUM_COLS) {
      return null;
    }
    return newRow * NUM_ROWS + newCol;
  }

  // modifies board
  function willResultInCheck(oldPosition, newPosition, color, board) {
    // set up board as if king had moved from oldPosition to newPosition
    board[newPosition] = board[oldPosition];
    board[oldPosition] = null;
    return isKingCheckedAtPosition(newPosition, color, board);
  }

  function isKingChecked(color, board) {
    let position;
    board.some((s, i) => {
      if (s && s.color === color && s.type === PieceTypeEnum.KING) {
        position = i;
        return true;
      }
      return false;
    });
    return isKingCheckedAtPosition(position, color, board);
  }

  function isKingCheckedAtPosition(position, color, board) {
    for (let i = 0; i < board.length; i++) {
      let currentSquare = board[i];
      if (!currentSquare || currentSquare.color === color) {
        continue;
      }
      let validMoves;
      if (currentSquare.type === PieceTypeEnum.KING) {
        validMoves = PieceTypeEnum.properties[PieceTypeEnum.KING].findPossibleMoves(i);
      } else {
        validMoves = PieceTypeEnum.properties[currentSquare.type].findValidMoves(i, board);
      }

      if (validMoves.includes(position)) {
        return true;
      }
    }
    return false;
  }

  function findPieceImgName(type, color) {
    return "images/" + PieceTypeEnum.properties[type].name + "-" + ColorEnum.properties[color].name + ".png";
  }
  
  function isValidMove(startPosition, endPosition, board) {
    // todo check that piece exists at start position
    return findValidMoves(startPosition, board).includes(endPosition);
  }

  // returns a list of positions where the piece at the given position can move
  function findValidMoves(position, board) {
    const piece = board[position];
    return PieceTypeEnum.properties[piece.type].findValidMoves(position, board);
  }

  return {
    NUM_ROWS: NUM_ROWS,
    NUM_COLS: NUM_COLS,
    Piece: Piece,
    ColorEnum: ColorEnum,
    PieceTypeEnum: PieceTypeEnum,
    findPieceImgName: findPieceImgName,
    isValidMove: isValidMove,
    isKingChecked: isKingChecked
  }

}()
