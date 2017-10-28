var Chess = function() {

  var ColorEnum = {
    WHITE: 1,
    BLACK: 2,
    properties: {
      1: {name: "white", value: 1},
      2: {name: "black", value: 2}
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
          // move up (or down) one row
          let newPosition = calculateNewPosition(position, -1, 0);
          if (newPosition > 0 && newPosition < 64 && board[newPosition] === null) {
            validMoves.push(newPosition);
          }

          // if at start position
          //if (inStartRow(position)) {
          //  // move up (or down) two rows
          //  newPosition = calculateNewPosition(position, -2, 0);
          //  if (newPosition > 0 && newPosition < 64 && board[newPosition] === null) {
          //    validMoves.push(newPosition);
          //  }
          //}
            
          // if can capture opponent
          //newPosition = calculateNewPosition(position, -1, -1);
          //if (newPosition > 0 && newPosition < 64/* && board[newPosition] === null)*/) {
          //  validMoves.push(newPosition);
          //}
          //newPosition = calculateNewPosition(position, -1, 1);
          //if (newPosition > 0 && newPosition < 64/* && board[newPosition] === null)*/) {
          //  validMoves.push(newPosition);
          //}
          //   move up (or down) one row and left/right one column
          // remove any moves outside the board boundaries 
          return validMoves;
        }, 
      },
      2: {name: "knight", value: 2},
      3: {name: "bishop", value: 3},
      4: {name: "rook", value: 4},
      5: {name: "queen", value: 5},
      6: {name: "king", value: 6}
    }
  };

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
    return findValidMoves(startPosition, board).includes(endPosition);
  }

  // returns a list of positions where the piece at the given position can move
  function findValidMoves(position, board) {
    const piece = board[position];
    return PieceTypeEnum.properties[1].findValidMoves(position, board);
    // if no piece at position
    //   return []\
    // 
  }

  return {
    ColorEnum: ColorEnum,
    PieceTypeEnum: PieceTypeEnum,
    findPieceImgName: findPieceImgName,
    isValidMove: isValidMove,
  }

}()
