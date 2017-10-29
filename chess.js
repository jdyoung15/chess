var Chess = function() {
  
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
        PAWN_DIRECTION: -1,
        value: 0
      },
      1: {
        name: "black", 
        PAWN_START_ROW: 1, 
        PAWN_DIRECTION: 1,
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
          const validMoves = [];
          const color = board[position].color;

          // move up (or down) one row
          let newPosition = calculateNewPosition(position, 1 * ColorEnum.properties[color].PAWN_DIRECTION, 0);
          if (newPosition !== null && board[newPosition] === null) {
            validMoves.push(newPosition);
          }

          // if at start position
          if (this.inStartRow(position, board)) {
            // move up (or down) two rows
            newPosition = calculateNewPosition(position, 2 * ColorEnum.properties[color].PAWN_DIRECTION, 0);
            if (newPosition !== null && board[newPosition] === null) {
              validMoves.push(newPosition);
            }
          }
            
          // if can capture opponent
          newPosition = calculateNewPosition(position, 1 * ColorEnum.properties[color].PAWN_DIRECTION, -1);
          if (newPosition !== null && containsOpponent(color, newPosition, board)) {
            validMoves.push(newPosition);
          }
          newPosition = calculateNewPosition(position, 1 * ColorEnum.properties[color].PAWN_DIRECTION, 1);
          if (newPosition !== null && containsOpponent(color, newPosition, board)) {
            validMoves.push(newPosition);
          }
          return validMoves;
        }, 
        inStartRow: function(position, board) {
          const color = board[position].color;
          return ColorEnum.properties[color].PAWN_START_ROW === findRow(position);
        },
      },
      1: {name: "knight", value: 1},
      2: {
        name: "bishop", 
        value: 2,
        findValidMoves: function(position, board) {
          let validMoves = [];
          const color = board[position].color;

          // find squares in above left diagonal
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, -1, -1));
          // find squares in above right diagonal
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, -1, 1));
          // find squares in bottom left diagonal
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, 1, -1));
          // find squares in bottom right diagonal
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, 1, 1));

          return validMoves;
        }, 
      },
      3: {
        name: "rook", 
        value: 3,
        findValidMoves: function(position, board) {
          let validMoves = [];
          const color = board[position].color;

          // find squares above
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, -1, 0));
          // find squares below
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, 1, 0));
          // find squares left
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, 0, -1));
          // find squares right
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, 0, 1));

          return validMoves;
        }, 
      },
      4: {
        name: "queen", 
        value: 4,
        findValidMoves: function(position, board) {
          let validMoves = [];
          const color = board[position].color;

          // find squares in above left diagonal
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, -1, -1));
          // find squares in above right diagonal
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, -1, 1));
          // find squares in bottom left diagonal
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, 1, -1));
          // find squares in bottom right diagonal
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, 1, 1));
          // find squares above
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, -1, 0));
          // find squares below
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, 1, 0));
          // find squares left
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, 0, -1));
          // find squares right
          validMoves = validMoves.concat(findValidSquaresInDirection(position, board, 0, 1));

          return validMoves;
        }, 
      },
      5: {
        name: "king", 
        value: 5,
      }
    }
  };

  function findValidSquaresInDirection(position, board, rows, cols) {
    const validMoves = [];
    const color = board[position].color;
    findSquaresInDirection(position, rows, cols).every(s => {
      if (isValidSquare(board[s], color)) {
        validMoves.push(s);
      }
      // if square is occupied, no further squares to consider; return false to exit iteration
      return !board[s];
    });
    return validMoves;
  }

  function isValidSquare(square, color) {
    return !square || square.color !== color;
  }

  function inBounds(position) {
    return position >= 0 && position < 64;
  }

  function findSquaresInDirection(position, rows, cols) {
    const squares = [];
    let square = calculateNewPosition(position, rows, cols);
    while (square !== null) {
      squares.push(square);
      square = calculateNewPosition(square, rows, cols);
    }
    return squares;
  }

  function containsOpponent(color, position, board) {
    return board[position] && board[position].color !== color;
  }

  function findRow(position) {
    return Math.floor(position / 8);
  }

  function findCol(position) {
    return position % 8;
  }

  // may return null
  function calculateNewPosition(oldPosition, rows, cols) {
    const oldRow = findRow(oldPosition);
    const oldCol = findCol(oldPosition);
    const newRow = oldRow + rows;
    const newCol = oldCol + cols;
    if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) {
      return null;
    }
    return newRow * 8 + newCol;
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
    Piece: Piece,
    ColorEnum: ColorEnum,
    PieceTypeEnum: PieceTypeEnum,
    findPieceImgName: findPieceImgName,
    isValidMove: isValidMove,
  }

}()
