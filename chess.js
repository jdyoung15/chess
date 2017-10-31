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
        findValidMoves: function(position, board, previousMoves) {
          let validMoves = [];
          const color = board[position].color;
          const pawnDirection = ColorEnum.properties[color].PAWN_DIRECTION;
          
          const coordinatesMove = [
            // move foward one square
            [1 * pawnDirection,  0]
          ];
          if (this.inStartRow(position, board)) {
            // move foward two squares if in start row
            coordinatesMove.push(
              [2 * pawnDirection, 0]
            );
          }
          validMoves = validMoves.concat(
            findSquaresAtCoordinates(coordinatesMove, position)
              .filter(s => !board[s]));

          const coordinatesAttack = [
            // can attack forward left and forward right if square occupied by opponent, or if can en passant
            [1 * pawnDirection, -1],
            [1 * pawnDirection, 1],
          ]

          validMoves = validMoves.concat(
            findSquaresAtCoordinates(coordinatesAttack, position, board)
              .filter(s => (board[s] && board[s].color !== color) || isEnPassantMove(position, s, board, previousMoves)));

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
        findValidMoves: function(position, board, previousMoves) {
          return findValidMovesAtCoordinates(this.coordinates, position, board)
        }, 
      },
      2: {
        name: "bishop", 
        value: 2,
        directions: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
        findValidMoves: function(position, board, previousMoves) {
          return findValidMovesInDirection(this.directions, position, board);
        }, 
      },
      3: {
        name: "rook", 
        value: 3,
        directions: [[-1, 0], [1, 0], [0, -1], [0, 1]],
        findValidMoves: function(position, board, previousMoves) {
          return findValidMovesInDirection(this.directions, position, board);
        }, 
      },
      4: {
        name: "queen", 
        value: 4,
        directions: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
        findValidMoves: function(position, board, previousMoves) {
          return findValidMovesInDirection(this.directions, position, board);
        }, 
      },
      5: {
        name: "king", 
        value: 5,
        coordinates: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
        findValidMoves: function(position, board, previousMoves) {
          return findValidMovesAtCoordinates(this.coordinates, position, board)
            .filter(newPosition => !willResultInCheck(position, newPosition, board[position.color], board.slice(), previousMoves));
        }, 
        findPossibleMoves: function(position) {
          return findSquaresAtCoordinates(this.coordinates, position);
        },
      }
    }
  };

  const PIECES_STARTING_ORDER = [
    PieceTypeEnum.ROOK,
    PieceTypeEnum.KNIGHT,
    PieceTypeEnum.BISHOP,
    PieceTypeEnum.QUEEN,
    PieceTypeEnum.KING,
    PieceTypeEnum.BISHOP,
    PieceTypeEnum.KNIGHT,
    PieceTypeEnum.ROOK,
  ];
  
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

  function findRow(position) {
    return Math.floor(position / NUM_ROWS);
  }

  function findCol(position) {
    return position % NUM_ROWS;
  }

  function isCheckmate(color, board, previousMoves) {
    // create array from 0 to 64
    const positions = Array.apply(null, {length: NUM_ROWS * NUM_COLS}).map(Function.call, Number);
    // figure out squares that can block check
    const kingPosition = findKingPosition(color, board);
    return isKingCheckedAtPosition(kingPosition, color, board, previousMoves)
      && PieceTypeEnum.properties[PieceTypeEnum.KING].findValidMoves(kingPosition, board, previousMoves).length === 0
      && positions
        .filter(p => board[p] && board[p].color === color)
        .filter(p => canBlockCheck(p, board))
        .length === 0;
  }

  // modifies board
  function willResultInCheck(oldPosition, newPosition, color, board, previousMoves) {
    // set up board as if king had moved from oldPosition to newPosition
    board[newPosition] = board[oldPosition];
    board[oldPosition] = null;
    return isKingCheckedAtPosition(newPosition, color, board, previousMoves);
  }

  function isKingChecked(color, board, previousMoves) {
    return isKingCheckedAtPosition(findKingPosition(color, board), color, board, previousMoves);
  }

  function isKingCheckedAtPosition(position, color, board, previousMoves) {
    for (let i = 0; i < board.length; i++) {
      let currentSquare = board[i];
      if (!currentSquare || currentSquare.color === color) {
        continue;
      }
      let validMoves;
      if (currentSquare.type === PieceTypeEnum.KING) {
        validMoves = PieceTypeEnum.properties[PieceTypeEnum.KING].findPossibleMoves(i);
      } else {
        validMoves = PieceTypeEnum.properties[currentSquare.type].findValidMoves(i, board, previousMoves);
      }

      if (validMoves.includes(position)) {
        return true;
      }
    }
    return false;
  }

  // assumes king is currently checked
  function canBlockCheck(position, board, previousMoves) {
    const color = board[position].color;
    const kingPosition = findKingPosition(color, board);
    return findValidMoves(position, board, previousMoves).some(s => {
      let boardCopy = board.slice();
      boardCopy[s] = boardCopy[position];
      boardCopy[position] = null;
      return !isKingCheckedAtPosition(kingPosition, color, boardCopy, previousMoves);
    });
  }

  function findKingPosition(color, board) {
    let position;
    board.some((s, i) => {
      if (s && s.color === color && s.type === PieceTypeEnum.KING) {
        position = i;
        return true;
      }
      return false;
    });
    return position;
  }

  function findPieceImgName(type, color) {
    return "images/" + PieceTypeEnum.properties[type].name + "-" + ColorEnum.properties[color].name + ".png";
  }

  function isEnPassantMove(startPosition, endPosition, board, previousMoves) {
    if (!board[startPosition] || board[startPosition].type !== PieceTypeEnum.PAWN || previousMoves.length < 1) {
      return false;
    }
    const color = board[startPosition].color;
    const opponentPawnDirection = ColorEnum.properties[findNextPlayer(color)].PAWN_DIRECTION;
    const squareBackward = calculateNewPosition(endPosition, -1 * opponentPawnDirection, 0);
    const squareForward = calculateNewPosition(endPosition, 1 * opponentPawnDirection, 0);
    if (!squareBackward || !squareForward) {
      return false;
    }
    const previousMove = previousMoves[previousMoves.length - 1];
    return board[squareForward] 
      && board[squareForward].type === PieceTypeEnum.PAWN 
      && board[squareForward].color === findNextPlayer(color)
      && previousMove[0] === squareBackward
      && previousMove[1] === squareForward;
  }

  function findEnPassantPieceToCapture(position, color) {
    return calculateNewPosition(position, -1 * ColorEnum.properties[color].PAWN_DIRECTION, 0);
  }
  
  function isValidMove(startPosition, endPosition, board, previousMoves) {
    return findValidMoves(startPosition, board, previousMoves).includes(endPosition);
  }

  function hasValidMoves(position, board, previousMoves) {
    return findValidMoves(position, board, previousMoves).length > 0;
  }

  // returns a list of positions where the piece at the given position can move
  function findValidMoves(position, board, previousMoves) {
    const piece = board[position];
    return PieceTypeEnum.properties[piece.type].findValidMoves(position, board, previousMoves);
  }

  function createInitialSquares() {
    const board = Array(64).fill(null);

    for (let i = 0; i < NUM_ROWS; i++) {
      board[i] = new Piece(PIECES_STARTING_ORDER[i], ColorEnum.BLACK);
      board[calculateNewPosition(i, 7, 0)] = new Piece(PIECES_STARTING_ORDER[i], ColorEnum.WHITE);
    }

    for (let i = NUM_ROWS; i < NUM_ROWS * 2; i++) {
      board[i] = new Piece(PieceTypeEnum.PAWN, ColorEnum.BLACK);
      board[calculateNewPosition(i, 5, 0)] = new Piece(PieceTypeEnum.PAWN, ColorEnum.WHITE);
    }

    return board;
  }

  function findNextPlayer(currentPlayer) {
    return currentPlayer === ColorEnum.WHITE ? ColorEnum.BLACK : ColorEnum.WHITE;
  }

  return {
    NUM_ROWS: NUM_ROWS,
    NUM_COLS: NUM_COLS,
    Piece: Piece,
    ColorEnum: ColorEnum,
    PieceTypeEnum: PieceTypeEnum,
    findPieceImgName: findPieceImgName,
    isValidMove: isValidMove,
    isKingChecked: isKingChecked,
    createInitialSquares: createInitialSquares,
    canBlockCheck: canBlockCheck,
    isCheckmate: isCheckmate,
    hasValidMoves: hasValidMoves,
    findNextPlayer: findNextPlayer,
    isEnPassantMove: isEnPassantMove,
    findEnPassantPieceToCapture: findEnPassantPieceToCapture,
  }

}()
