var Chess = function() {

  //
  // Constants
  //

  const NUM_ROWS = 8;
  const NUM_COLS = 8;


  // 
  // Classes 
  //

  const Piece = class Piece {
    constructor(type, color) {
      this.type = type;
      this.color = color;
    }
  };


  //
  // Enums
  //

  const CastlingEnum = {
    KINGSIDE: 0,
    QUEENSIDE: 1,
    properties: {
      0: {
        name: "kingside",
        direction: 1, // positive value since king moves right
        numSquaresBetween: 2,
        numSquaresKingMove: 2,
        numSquaresRookMove: 2,
        whichRook: 1,
        value: 0,
      },
      1: {
        name: "queenside",
        direction: -1, // negative value since king moves right
        numSquaresBetween: 3,
        numSquaresKingMove: 2,
        numSquaresRookMove: 3,
        whichRook: 0,
        value: 1,
      },
    },
  };

  const ColorEnum = {
    WHITE: 0,
    BLACK: 1,
    properties: {
      0: {
        name: "white", 
        NON_PAWN_START_ROW: 7, 
        PAWN_START_ROW: 6,
        PAWN_DIRECTION: -1, // up 
        value: 0
      },
      1: {
        name: "black", 
        NON_PAWN_START_ROW: 0, 
        PAWN_START_ROW: 1,
        PAWN_DIRECTION: 1, // down
        value: 1
      }
    }
  };

  const PieceTypeEnum = {
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
        findPossibleMoves: function(position, board, previousMoves) {
          const color = board[position].color;
          const pawnDirection = ColorEnum.properties[color].PAWN_DIRECTION;
          
          const directionsMove = [
            [1 * pawnDirection,  0]
          ];
          const directionsMoveLimit = ColorEnum.properties[color].PAWN_START_ROW === findRow(position) ? 2 : 1;

          let possibleMoves = [];
          possibleMoves = possibleMoves.concat(
            findPossibleMovesInDirections(directionsMove, position, board, directionsMoveLimit)
              .filter(s => isEmptySquare(board[s])));

          const directionsAttack = [
            // can attack forward left and forward right, if square occupied by opponent or if en passant
            [1 * pawnDirection, -1],
            [1 * pawnDirection, 1],
          ]

          possibleMoves = possibleMoves.concat(
            findPossibleMovesInDirections(directionsAttack, position, board, 1)
              .filter(s => isOpponentSquare(board[s], color) || isEnPassantMove(position, s, board, previousMoves)));

          return possibleMoves;
        }, 
      },
      1: {
        name: "knight", 
        value: 1,
        directions: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [2, -1], [2, 1], [1, -2], [1, 2]],
        findPossibleMoves: function(position, board, previousMoves) {
          return findPossibleMovesInDirections(this.directions, position, board, 1);
        }, 
      },
      2: {
        name: "bishop", 
        value: 2,
        directions: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
        findPossibleMoves: function(position, board, previousMoves) {
          return findPossibleMovesInDirections(this.directions, position, board, Number.MAX_SAFE_INTEGER);
        }, 
      },
      3: {
        name: "rook", 
        value: 3,
        directions: [[-1, 0], [1, 0], [0, -1], [0, 1]],
        findPossibleMoves: function(position, board, previousMoves) {
          return findPossibleMovesInDirections(this.directions, position, board, Number.MAX_SAFE_INTEGER);
        }, 
      },
      4: {
        name: "queen", 
        value: 4,
        directions: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
        findPossibleMoves: function(position, board, previousMoves) {
          return findPossibleMovesInDirections(this.directions, position, board, Number.MAX_SAFE_INTEGER);
        }, 
      },
      5: {
        name: "king", 
        value: 5,
        directions: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
        findPossibleMoves: function(position, board, previousMoves) {
          const color = board[position].color;
          let possibleMoves = this.findPossibleStandardMoves(position, board);

          possibleMoves = possibleMoves.concat(
            findPossibleCastlingMoves(position).filter(p => p && isCastlingMove(position, p, board, previousMoves)));

          return possibleMoves;
        }, 
        findPossibleStandardMoves: function(position, board) {
          return findPossibleMovesInDirections(this.directions, position, board, 1);
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

  const PAWN_PROMOTION_CHOICES = [
    PieceTypeEnum.QUEEN,
    PieceTypeEnum.ROOK,
    PieceTypeEnum.BISHOP,
    PieceTypeEnum.KNIGHT,
  ];


  //
  // Castling functions
  //
  function findPossibleCastlingMoves(kingStartPosition) {
    const castlingCoordinates = [
      [0, CastlingEnum.properties[CastlingEnum.KINGSIDE].numSquaresKingMove],
      [0, -1 * CastlingEnum.properties[CastlingEnum.QUEENSIDE].numSquaresKingMove],
    ];

    return castlingCoordinates
      .map(c => calculateNewPosition(kingStartPosition, c[0], c[1]));
  }

  function isCastlingMove(startPosition, endPosition, board, previousMoves) {
    const color = board[startPosition].color;
    if (board[startPosition].type !== PieceTypeEnum.KING
      || isKingChecked(startPosition, board, previousMoves) 
      || hasPieceMoved(findStartPosition(PieceTypeEnum.KING, color, 0), previousMoves)
      || !findPossibleCastlingMoves(startPosition).includes(endPosition))
    {
      return false;
    }

    const castling = startPosition < endPosition ? CastlingEnum.KINGSIDE : CastlingEnum.QUEENSIDE;
    const rookStartPosition = findStartPosition(PieceTypeEnum.ROOK, color, CastlingEnum.properties[castling].whichRook);
    const direction = CastlingEnum.properties[castling].direction;

    return board[rookStartPosition]
      && !hasPieceMoved(rookStartPosition, previousMoves)
      // number of pieces between king and rook is 0
      && createArrayRange(startPosition + 1 * direction, rookStartPosition).every(s => !board[s])
      // king is not in check during any intervening square
      && createArrayRange(startPosition + 1 * direction, endPosition + 1 * direction)
           .every(s => {
             let boardCopy = board.slice();
             boardCopy[s] = boardCopy[startPosition];
             boardCopy[startPosition] = null;
             return !isKingChecked(s, boardCopy, previousMoves);
           });
  }

  // start inclusive, end noninclusive
  function createArrayRange(start, end) {
    const direction = end < start ? -1 : 1;
    return Array(Math.abs(end - start)).fill(null).map((n, i) => start + i * direction);
  }

  function findCastlingRookStartPosition(kingStartPosition, kingEndPosition, board) {
    const color = board[kingStartPosition].color;
    const castling = kingStartPosition < kingEndPosition ? CastlingEnum.KINGSIDE : CastlingEnum.QUEENSIDE;
    const direction = CastlingEnum.properties[castling].direction;
    return findStartPosition(PieceTypeEnum.ROOK, color, CastlingEnum.properties[castling].whichRook);
  }

  function findCastlingRookEndPosition(kingStartPosition, kingEndPosition, board) {
    const castling = kingStartPosition < kingEndPosition ? CastlingEnum.KINGSIDE : CastlingEnum.QUEENSIDE;
    const direction = CastlingEnum.properties[castling].direction;
    const numSquaresRookMove = CastlingEnum.properties[castling].numSquaresRookMove;

    const startPosition = findCastlingRookStartPosition(kingStartPosition, kingEndPosition, board);
    return calculateNewPosition(startPosition, 0, numSquaresRookMove * direction * -1);
  }

  function findStartPosition(type, color, which) {
    // find starting row, from color
    let row;
    let col;
    if (type === PieceTypeEnum.PAWN) {
      row = ColorEnum.properties[color].PAWN_START_ROW
      col = which;
    } else {
      row = ColorEnum.properties[color].NON_PAWN_START_ROW;
      col = 
        PIECES_STARTING_ORDER
          .map((piece, i) => [piece, i])
          .filter(pair => pair[0] === type)
          .map(pair => pair[1])
          [which]
    }

    return row * NUM_ROWS + col;
  }

  function hasPieceMoved(startPosition, previousMoves) {
    // return whether if previousMoves contains position as first move
    return previousMoves.some(m => m[0] === startPosition);
  }


  //
  // Position and move functions
  //

  //function isValidMove(startPosition, endPosition, board, previousMoves) {
  //  return findValidMoves(startPosition, board, previousMoves).includes(endPosition);
  //}

  //function hasValidMoves(position, board, previousMoves) {
  //  return findValidMoves(position, board, previousMoves).length > 0;
  //}

  function findAllValidMoves(color, board, previousMoves) {
    return board
      .map((s, i) => {
        if (!s || s.color !== color) {
          return [];
        }
        return findValidMovesAtPosition(i, board, previousMoves);
      });
  }

  // returns a list of positions where the piece at the given position can move
  function findValidMovesAtPosition(position, board, previousMoves) {
    const piece = board[position];
    const possibleMoves = PieceTypeEnum.properties[piece.type].findPossibleMoves(position, board, previousMoves);
    return possibleMoves.filter(s => isMoveValid(position, s, board, previousMoves));
  }

  // assumes that the piece to move is currently at oldPosition
  function isMoveValid(oldPosition, newPosition, board, previousMoves) {
    const piece = board[oldPosition];
    const boardAfterMove = simulateMove(oldPosition, newPosition, board);
    const kingPosition = piece.type === PieceTypeEnum.KING ? newPosition : findKingPosition(piece.color, boardAfterMove);
    return !isKingChecked(kingPosition, boardAfterMove, previousMoves);
  }

  function findPossibleMovesInDirections(directions, position, board, limit) {
    return directions
      .map(d => findSquaresInDirection(position, d, limit))
      .map(squares => filterPossibleSquaresInDirection(squares, board, board[position].color))
      .reduce((a, b) => a.concat(b));
  }

  function findSquaresInDirection(position, direction, limit) {
    const rowIncrement = direction[0];
    const colIncrement = direction[1];
    const squares = [];
    let i = 0;
    let newPosition = calculateNewPosition(position, rowIncrement, colIncrement);
    while (i < limit && newPosition !== null) {
      squares.push(newPosition);
      newPosition = calculateNewPosition(newPosition, rowIncrement, colIncrement);
      i++;
    }
    return squares;
  }

  function filterPossibleSquaresInDirection(squares, board, color) {
    const possibleSquares = [];
    for (let i = 0; i < squares.length; i++) {
      let s = squares[i];
      if (isPossibleMoveSquare(board[s], color)) {
        possibleSquares.push(s);
      }
      // if square is occupied, no further squares to consider; exit iteration
      if (board[s]) {
        break;
      }
    }
    return possibleSquares
  }

  function isPossibleMoveSquare(square, color) {
    return isEmptySquare(square) || isOpponentSquare(square, color);
  }

  function isEmptySquare(square) {
    return !square;
  }

  function isOpponentSquare(square, color) {
    return !isEmptySquare(square) && square.color !== color;
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


  //
  // Check/checkmate functions
  //

  function isCheckmate(color, board, previousMoves) {
    // create array from 0 to 64
    const positions = Array.apply(null, {length: NUM_ROWS * NUM_COLS}).map(Function.call, Number);
    // figure out squares that can block check
    const kingPosition = findKingPosition(color, board);
    return isKingCheckedAtPosition(kingPosition, color, board, previousMoves)
      && findValidMovesAtPosition(kingPosition, board, previousMoves).length === 0
      && positions.every(p => {
           return !board[p] 
             || board[p].color !== color
             || PieceTypeEnum.properties[board[p].type]
                  .findPossibleMoves(p, board, previousMoves)
                  .every(s => isKingCheckedAtPosition(kingPosition, color, simulateMove(p, s, board), previousMoves));
         });
  }

  function findKingPosition(color, board) {
    return board.findIndex(s => s && s.color === color && s.type === PieceTypeEnum.KING);
  }

  function isKingChecked(kingPosition, board, previousMoves) {
    const opponentColor = findNextPlayer(board[kingPosition].color);
    const opponentPositions = board.map((s, i) => s && s.color === opponentColor && i).filter(p => p);
    return opponentPositions.some(p => {
      let piece = board[p];
      let opponentPossibleMoves = piece.type === PieceTypeEnum.KING
        ? PieceTypeEnum.properties[PieceTypeEnum.KING].findPossibleStandardMoves(p, board)
        : PieceTypeEnum.properties[piece.type].findPossibleMoves(p, board, previousMoves);

      return opponentPossibleMoves.includes(kingPosition);
    });
  }

  function isKingCheckedAtPosition(position, color, board, previousMoves) {
    // find opposing pieces
    // for each opposing piece
    //   if possible moves includes king position
    //     return true
    for (let i = 0; i < board.length; i++) {
      let currentSquare = board[i];
      if (!currentSquare || currentSquare.color === color) {
        continue;
      }
      let possibleMoves;
      if (currentSquare.type === PieceTypeEnum.KING) {
        possibleMoves = PieceTypeEnum.properties[PieceTypeEnum.KING].findPossibleStandardMoves(i, board);
      } else {
        possibleMoves = PieceTypeEnum.properties[currentSquare.type].findPossibleMoves(i, board, previousMoves);
      }

      if (possibleMoves.includes(position)) {
        return true;
      }
    }
    return false;
  }

  function simulateMove(oldPosition, newPosition, board) {
    const boardCopy = board.slice();
    boardCopy[newPosition] = boardCopy[oldPosition];
    boardCopy[oldPosition] = null;
    return boardCopy;
  }


  // 
  // En passant functions
  //

  function isEnPassantMove(startPosition, endPosition, board, previousMoves) {
    const attackPawn = board[startPosition];
    if (!attackPawn || attackPawn.type !== PieceTypeEnum.PAWN || previousMoves.length < 1) {
      return false;
    }

    const color = board[startPosition].color;
    const pawnDirection = ColorEnum.properties[color].PAWN_DIRECTION;

    //  if en passant move, victim pawn should be directly behind attack pawn
    const victimPawnPosition = calculateNewPosition(endPosition, -1 * pawnDirection, 0);
    const victimPawn = board[victimPawnPosition];
    if (!victimPawn || victimPawn.color === color || victimPawn.type !== PieceTypeEnum.PAWN) {
      return false;
    }

    // if en passant move, victim pawn should have just moved from square in front of attack pawn
    const victimPawnStartPosition = calculateNewPosition(endPosition, 1 * pawnDirection, 0);
    const previousMove = previousMoves[previousMoves.length - 1];
    if (previousMove[0] !== victimPawnStartPosition || previousMove[1] !== victimPawnPosition) {
      return false;
    }

    return true;
  }

  function findEnPassantVictimPosition(attackPawnPosition, color) {
    return calculateNewPosition(attackPawnPosition, -1 * ColorEnum.properties[color].PAWN_DIRECTION, 0);
  }
  

  // 
  // Miscellaneous functions
  //

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

  function findPieceImgName(type, color) {
    return "images/" + PieceTypeEnum.properties[type].name + "-" + ColorEnum.properties[color].name + ".png";
  }

  function isPawnPromotion(position, squares) {
    if (!squares[position]) {
      return false;
    }
    const color = squares[position].color;
    const opposingColor = findNextPlayer(color);
    return squares[position].type === PieceTypeEnum.PAWN 
      && findRow(position) === ColorEnum.properties[opposingColor].NON_PAWN_START_ROW;
  }

  return {
    NUM_ROWS: NUM_ROWS,
    NUM_COLS: NUM_COLS,
    PAWN_PROMOTION_CHOICES: PAWN_PROMOTION_CHOICES,
    Piece: Piece,
    ColorEnum: ColorEnum,
    PieceTypeEnum: PieceTypeEnum,
    isCheckmate: isCheckmate,
    isEnPassantMove: isEnPassantMove,
    findEnPassantVictimPosition: findEnPassantVictimPosition,
    createInitialSquares: createInitialSquares,
    findNextPlayer: findNextPlayer,
    findPieceImgName: findPieceImgName,
    isCastlingMove: isCastlingMove,
    findCastlingRookStartPosition: findCastlingRookStartPosition,
    findCastlingRookEndPosition: findCastlingRookEndPosition,
    isPawnPromotion: isPawnPromotion,
    findAllValidMoves: findAllValidMoves,
  }

}()
