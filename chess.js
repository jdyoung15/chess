var Chess = function() {

  //
  // Constants
  //

  const NUM_ROWS = 8;
  const NUM_COLS = 8;
  const NUM_SQUARES = 64;


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
        value: 0,
        0: { // white
          KING_OLD_POSITION: 60,
          KING_NEW_POSITION: 62,
          ROOK_OLD_POSITION: 63,
          ROOK_NEW_POSITION: 61,
          POSITIONS_BETWEEN: [61, 62],
          KING_SQUARES_TRAVELED: [61, 62],
        },
        1: { // black
          KING_OLD_POSITION: 4,
          KING_NEW_POSITION: 6,
          ROOK_OLD_POSITION: 7,
          ROOK_NEW_POSITION: 5,
          POSITIONS_BETWEEN: [5, 6],
          KING_SQUARES_TRAVELED: [5, 6],
        },
      },
      1: {
        name: "queenside",
        value: 1,
        0: { // white
          KING_OLD_POSITION: 60,
          KING_NEW_POSITION: 58,
          ROOK_OLD_POSITION: 56,
          ROOK_NEW_POSITION: 59,
          POSITIONS_BETWEEN: [57, 58, 59],
          KING_SQUARES_TRAVELED: [59, 58],
        },
        1: { // black
          KING_OLD_POSITION: 4,
          KING_NEW_POSITION: 2,
          ROOK_OLD_POSITION: 0,
          ROOK_NEW_POSITION: 3,
          POSITIONS_BETWEEN: [1, 2, 3],
          KING_SQUARES_TRAVELED: [3, 2],
        },
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
        value: 0,
      },
      1: {
        name: "black", 
        NON_PAWN_START_ROW: 0, 
        PAWN_START_ROW: 1,
        PAWN_DIRECTION: 1, // down
        value: 1,
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
            findPossibleCastlingMoves(color)
              .filter(p => p && isCastlingMove(position, p, board, previousMoves)));

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
    const victimPawnPosition = findEnPassantVictimPosition(endPosition, color);
    const victimPawn = board[victimPawnPosition];
    if (!victimPawn || victimPawn.color === color || victimPawn.type !== PieceTypeEnum.PAWN) {
      return false;
    }

    // if en passant move, victim pawn must have just moved from square in front of attack pawn
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
  // Castling functions
  //

  function findPossibleCastlingMoves(color) {
    return [
      CastlingEnum.properties[CastlingEnum.KINGSIDE][color].KING_NEW_POSITION,
      CastlingEnum.properties[CastlingEnum.QUEENSIDE][color].KING_NEW_POSITION,
    ];
  }

  function isCastlingMove(startPosition, endPosition, board, previousMoves) {
    const piece = board[startPosition];
    const castling = findCastlingSide(startPosition, endPosition);
    const kingStartPosition = CastlingEnum.properties[castling][piece.color].KING_OLD_POSITION;

    if (piece.type !== PieceTypeEnum.KING
      || isKingCheckedAtPosition(startPosition, board, previousMoves) 
      || hasPieceMoved(kingStartPosition, previousMoves)
      || !findPossibleCastlingMoves(piece.color).includes(endPosition))
    {
      return false;
    }

    const rookStartPosition = CastlingEnum.properties[castling][piece.color].ROOK_OLD_POSITION;

    return board[rookStartPosition]
      && !hasPieceMoved(rookStartPosition, previousMoves)
      // number of pieces between king and rook is 0
      && CastlingEnum.properties[castling][piece.color].POSITIONS_BETWEEN.every(p => isEmptySquare(board[p]))
      // king is not in check during any intervening square
      && CastlingEnum.properties[castling][piece.color].KING_SQUARES_TRAVELED
           .every(s => !isKingCheckedAtPosition(s, updateBoard(startPosition, s, board.slice()), previousMoves));

  }

  function hasPieceMoved(startPosition, previousMoves) {
    return previousMoves.some(m => m[0] === startPosition);
  }

  function findCastlingRookStartPosition(kingStartPosition, kingEndPosition, board) {
    const color = board[kingStartPosition].color;
    const castling = findCastlingSide(kingStartPosition, kingEndPosition);
    return CastlingEnum.properties[castling][color].ROOK_OLD_POSITION;
  }

  function findCastlingRookEndPosition(kingStartPosition, kingEndPosition, board) {
    const color = board[kingStartPosition].color;
    const castling = findCastlingSide(kingStartPosition, kingEndPosition);
    return CastlingEnum.properties[castling][color].ROOK_NEW_POSITION;
  }

  function findCastlingSide(kingStartPosition, kingEndPosition) {
    return kingStartPosition < kingEndPosition ? CastlingEnum.KINGSIDE : CastlingEnum.QUEENSIDE;
  }


  //
  // Position and move functions
  //

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
    const boardAfterMove = updateBoard(oldPosition, newPosition, board.slice());
    const kingPosition = piece.type === PieceTypeEnum.KING ? newPosition : findKingPosition(piece.color, boardAfterMove);
    return !isKingCheckedAtPosition(kingPosition, boardAfterMove, previousMoves);
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

  function isCurrentPlayerSquare(square, color) {
    return !isEmptySquare(square) && square.color === color;
  }

  // may return null
  function calculateNewPosition(oldPosition, rows, cols) {
    const oldRow = findRow(oldPosition);
    const oldCol = findCol(oldPosition);
    const newRow = oldRow + rows;
    const newCol = oldCol + cols;
    // exit if new position is outside board boundaries
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
  // Check functions
  //

  function findKingPosition(color, board) {
    return board.findIndex(s => isCurrentPlayerSquare(s, color) && s.type === PieceTypeEnum.KING);
  }

  function isKingChecked(color, board, previousMoves) {
    const kingPosition = findKingPosition(color, board);
    return isKingCheckedAtPosition(kingPosition, board, previousMoves);
  }

  function isKingCheckedAtPosition(kingPosition, board, previousMoves) {
    const opponentColor = findNextPlayer(board[kingPosition].color);
    const positions = Array(NUM_SQUARES).fill(null).map((each, i) => i);
    const opponentPositions = positions.filter(p => board[p] && board[p].color === opponentColor);
    return opponentPositions.some(p => {
      let piece = board[p];
      let opponentPossibleMoves = piece.type === PieceTypeEnum.KING
        ? PieceTypeEnum.properties[PieceTypeEnum.KING].findPossibleStandardMoves(p, board)
        : PieceTypeEnum.properties[piece.type].findPossibleMoves(p, board, previousMoves);

      return opponentPossibleMoves.includes(kingPosition);
    });
  }

  function updateBoard(oldPosition, newPosition, board) {
    board[newPosition] = board[oldPosition];
    board[oldPosition] = null;
    return board;
  }


  // 
  // Miscellaneous functions
  //

  function createInitialSquares() {
    const board = Array(NUM_SQUARES).fill(null);

    PIECES_STARTING_ORDER.forEach((p, i) => {
      let blackPiecePosition = i;
      let whitePiecePosition = calculateNewPosition(blackPiecePosition, 7, 0);
      board[blackPiecePosition] = new Piece(p, ColorEnum.BLACK);
      board[whitePiecePosition] = new Piece(p, ColorEnum.WHITE);

      let blackPawnPosition = calculateNewPosition(blackPiecePosition, 1, 0);
      let whitePawnPosition = calculateNewPosition(whitePiecePosition, -1, 0);
      board[blackPawnPosition] = new Piece(PieceTypeEnum.PAWN, ColorEnum.BLACK);
      board[whitePawnPosition] = new Piece(PieceTypeEnum.PAWN, ColorEnum.WHITE);
    });

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
    const piece = squares[position];
    const color = piece.color;
    const opposingColor = findNextPlayer(color);
    return piece.type === PieceTypeEnum.PAWN 
      && findRow(position) === ColorEnum.properties[opposingColor].NON_PAWN_START_ROW;
  }

  return {
    NUM_ROWS: NUM_ROWS,
    NUM_COLS: NUM_COLS,
    PAWN_PROMOTION_CHOICES: PAWN_PROMOTION_CHOICES,
    Piece: Piece,
    ColorEnum: ColorEnum,
    PieceTypeEnum: PieceTypeEnum,
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
    isKingChecked: isKingChecked,
    updateBoard: updateBoard,
  }

}()
