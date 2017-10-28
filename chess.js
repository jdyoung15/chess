var Chess = function() {
  
  var Piece = class Piece {
    constructor(type, color) {
      this.type = type;
      this.color = color;
    }
  };

  var ColorEnum = {
    WHITE: 1,
    BLACK: 2,
    properties: {
      1: {
        name: "white", 
        PAWN_START_ROW: 6, 
        PAWN_DIRECTION: -1,
        value: 1
      },
      2: {
        name: "black", 
        PAWN_START_ROW: 1, 
        PAWN_DIRECTION: 1,
        value: 2
      }
    }
  };

  var PieceTypeEnum = {
    PAWN: 1,
    KNIGHT: 2,
    BISHOP: 3,
    ROOK: 4,
    QUEEN: 5,
    KING: 6,
    properties: {
      1: {
        name: "pawn", 
        value: 1,
        findValidMoves: function(position, board) {
          const validMoves = [];
          const color = board[position].color;

          // move up (or down) one row
          let newPosition = calculateNewPosition(position, 1 * ColorEnum.properties[color].PAWN_DIRECTION, 0);
          if (newPosition >= 0 && newPosition < 64 && board[newPosition] === null) {
            validMoves.push(newPosition);
          }

          // if at start position
          if (this.inStartRow(position, board)) {
            // move up (or down) two rows
            newPosition = calculateNewPosition(position, 2 * ColorEnum.properties[color].PAWN_DIRECTION, 0);
            if (newPosition >= 0 && newPosition < 64 && board[newPosition] === null) {
              validMoves.push(newPosition);
            }
          }
            
          // if can capture opponent
          newPosition = calculateNewPosition(position, 1 * ColorEnum.properties[color].PAWN_DIRECTION, -1);
          if (newPosition >= 0 && newPosition < 64 && containsOpponent(color, newPosition, board)) {
            validMoves.push(newPosition);
          }
          newPosition = calculateNewPosition(position, 1 * ColorEnum.properties[color].PAWN_DIRECTION, 1);
          if (newPosition > 0 && newPosition < 64 && containsOpponent(color, newPosition, board)) {
            validMoves.push(newPosition);
          }
          return validMoves;
        }, 
        inStartRow: function(position, board) {
          const color = board[position].color;
          return ColorEnum.properties[color].PAWN_START_ROW === findRow(position);
        },
      },
      2: {name: "knight", value: 2},
      3: {name: "bishop", value: 3},
      4: {name: "rook", value: 4},
      5: {name: "queen", value: 5},
      6: {name: "king", value: 6}
    }
  };

  function containsOpponent(color, position, board) {
    return board[position] && board[position].color !== color;
  }

  function findRow(position) {
    return Math.floor(position / 8);
  }

  // may return null
  function calculateNewPosition(oldPosition, rows, cols) {
    let newPosition = oldPosition + rows * 8 + cols;
    if (newPosition < 0 || newPosition >= 64) {
      newPosition = null;
    }
    return newPosition;
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
