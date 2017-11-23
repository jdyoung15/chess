var Chess = function() {

  //
  // Constants
  //

  const NUM_ROWS = 8;
  const NUM_COLS = 8;
  const NUM_SQUARES = NUM_ROWS * NUM_COLS;


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
        findPossibleMovePositions: function(fromPosition, board, previousMoves) {
          const color = board[fromPosition].color;
          const pawnDirection = ColorEnum.properties[color].PAWN_DIRECTION;
          
          const directionsMove = [
            [1 * pawnDirection,  0]
          ];
          const directionsMoveLimit = ColorEnum.properties[color].PAWN_START_ROW === findRow(fromPosition) ? 2 : 1;

          let possibleMovePositions = [];
          possibleMovePositions = possibleMovePositions.concat(
            findPossibleMovePositions(directionsMove, fromPosition, board, directionsMoveLimit)
              .filter(s => isEmptySquare(board[s])));

          const directionsAttack = [
            // can attack forward left and forward right, if square occupied by opponent or if en passant
            [1 * pawnDirection, -1],
            [1 * pawnDirection, 1],
          ]

          possibleMovePositions = possibleMovePositions.concat(
            findPossibleMovePositions(directionsAttack, fromPosition, board, 1)
              .filter(s => isOpponentPiece(board[s], color) || isEnPassantMove(fromPosition, s, board, previousMoves)));

          return possibleMovePositions;
        }, 
      },
      1: {
        name: "knight", 
        value: 1,
        directions: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [2, -1], [2, 1], [1, -2], [1, 2]],
        findPossibleMovePositions: function(fromPosition, board, previousMoves) {
          return findPossibleMovePositions(this.directions, fromPosition, board, 1);
        }, 
      },
      2: {
        name: "bishop", 
        value: 2,
        directions: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
        findPossibleMovePositions: function(fromPosition, board, previousMoves) {
          return findPossibleMovePositions(this.directions, fromPosition, board, Number.MAX_SAFE_INTEGER);
        }, 
      },
      3: {
        name: "rook", 
        value: 3,
        directions: [[-1, 0], [1, 0], [0, -1], [0, 1]],
        findPossibleMovePositions: function(fromPosition, board, previousMoves) {
          return findPossibleMovePositions(this.directions, fromPosition, board, Number.MAX_SAFE_INTEGER);
        }, 
      },
      4: {
        name: "queen", 
        value: 4,
        directions: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
        findPossibleMovePositions: function(fromPosition, board, previousMoves) {
          return findPossibleMovePositions(this.directions, fromPosition, board, Number.MAX_SAFE_INTEGER);
        }, 
      },
      5: {
        name: "king", 
        value: 5,
        directions: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
        findPossibleMovePositions: function(fromPosition, board, previousMoves) {
          const color = board[fromPosition].color;
          let possibleMovePositions = this.findPossibleStandardMovePositions(fromPosition, board);

          possibleMovePositions = possibleMovePositions.concat(
            findPossibleCastlingPositions(color)
              .filter(p => p && isCastlingMove(fromPosition, p, board, previousMoves)));

          return possibleMovePositions;
        }, 
        findPossibleStandardMovePositions: function(fromPosition, board) {
          return findPossibleMovePositions(this.directions, fromPosition, board, 1);
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

  /**
   * Returns whether the move from @fromPosition to @toPosition is a valid en passant move:
   *   - the victim pawn must be adjacent to attacking pawn 
   *   - the victim pawn, in the move immediately prior, must have moved two squares from start 
   *     row to current position
   */
  function isEnPassantMove(fromPosition, toPosition, board, previousMoves) {
    const attackPawn = board[fromPosition];
    if (!attackPawn || attackPawn.type !== PieceTypeEnum.PAWN || previousMoves.length < 1) {
      return false;
    }

    const color = board[fromPosition].color;
    const pawnDirection = ColorEnum.properties[color].PAWN_DIRECTION;

    //  if en passant move, victim pawn should be directly behind attack pawn
    const victimPawnPosition = findEnPassantVictimPosition(toPosition, color);
    const victimPawn = board[victimPawnPosition];
    if (!victimPawn || victimPawn.color === color || victimPawn.type !== PieceTypeEnum.PAWN) {
      return false;
    }

    // if en passant move, victim pawn must have just moved from square in front of attack pawn
    const victimPawnStartPosition = calculatePosition(toPosition, 1 * pawnDirection, 0);
    const previousMove = previousMoves[previousMoves.length - 1];
    if (previousMove[0] !== victimPawnStartPosition || previousMove[1] !== victimPawnPosition) {
      return false;
    }

    return true;
  }

  /** For a valid en passant move, returns the captured pawn's position given the attacking pawn's position. */
  function findEnPassantVictimPosition(attackPawnPosition, color) {
    return calculatePosition(attackPawnPosition, -1 * ColorEnum.properties[color].PAWN_DIRECTION, 0);
  }
  

  //
  // Castling functions
  //

  /**
   * For a king of @color, returns the two possible positions the king can make if castling.
   * NOTE: This does not ensure that castling is possible for this king. The positions are returned regardless.
   */
  function findPossibleCastlingPositions(color) {
    return [
      CastlingEnum.properties[CastlingEnum.KINGSIDE][color].KING_NEW_POSITION,
      CastlingEnum.properties[CastlingEnum.QUEENSIDE][color].KING_NEW_POSITION,
    ];
  }

  /** 
   * Returns whether the move @fromPosition --> @toPosition is a valid castling move:
   *   - the king and rook have not moved since the start of the game
   *   - no pieces between king and rook
   *   - king is not currently in check
   *   - king does not pass through any square that is attacked by opponent
   */
  function isCastlingMove(fromPosition, toPosition, board, previousMoves) {
    const piece = board[fromPosition];
    const castling = findCastlingSide(fromPosition, toPosition);
    const kingStartPosition = CastlingEnum.properties[castling][piece.color].KING_OLD_POSITION;

    if (piece.type !== PieceTypeEnum.KING
      || isKingCheckedAtPosition(fromPosition, board, previousMoves) 
      || hasPieceMoved(kingStartPosition, previousMoves)
      || !findPossibleCastlingPositions(piece.color).includes(toPosition))
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
           .every(s => !isKingCheckedAtPosition(s, updateBoard(fromPosition, s, board.slice()), previousMoves));

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

  /**
   * For each square of the board, returns the valid squares that can be moved to from that square.
   * A square will have valid moves only if:
   *   - it is occupied by a piece
   *   - the piece belongs to the current player
   *   - the piece is allowed to move, e.g. it does not expose the king to check
   *   - there is another square that the piece can move to
   */
  function findAllValidMovePositions(color, board, previousMoves) {
    return board
      .map((square, i) => {
        if (isEmptySquare(square) || isOpponentPiece(square, color)) {
          return [];
        }
        return findValidMovePositions(i, board, previousMoves);
      });
  }

  /** 
   * For the square at @fromPosition, finds the valid squares that can be moved to from this square.
   * Assumes that, at this square, there is a piece belonging to the current player.
   */
  function findValidMovePositions(fromPosition, board, previousMoves) {
    const piece = board[fromPosition];
    const positions = PieceTypeEnum.properties[piece.type].findPossibleMovePositions(fromPosition, board, previousMoves);
    return positions.filter(toPosition => isMoveValid(fromPosition, toPosition, board, previousMoves));
  }

  /**
   * Returns whether the move @fromPosition --> @toPosition is valid:
   *   - it does not expose its own king to check
   *   - or, if king is already in check, it either blocks or captures the checking piece
   *
   * Assumes that, at @fromPosition, there is a piece belonging to the current player.
   */
  function isMoveValid(fromPosition, toPosition, board, previousMoves) {
    const piece = board[fromPosition];
    const boardAfterMove = updateBoard(fromPosition, toPosition, board.slice());
    const kingPosition = piece.type === PieceTypeEnum.KING ? toPosition : findKingPosition(piece.color, boardAfterMove);
    return !isKingCheckedAtPosition(kingPosition, boardAfterMove, previousMoves);
  }

  /**
   * For the piece at @fromPosition, finds all squares in each given direction that are possible to move to.
   */
  function findPossibleMovePositions(directions, fromPosition, board, limit) {
    const piece = board[fromPosition];
    return directions
      .map(direction => findMovePositions(fromPosition, direction, limit))
      .map(movePositions => filterMovePositions(movePositions, board, piece.color))
      .reduce((arrayLeft, arrayRight) => arrayLeft.concat(arrayRight));
  }

  /** 
   * For the piece at @fromPosition, finds all square in the given direction that are possible to move to.
   * A direction is represented by a pair of numbers, 
   *   e.g. [1, -1] which means the diagonal extending to the upper left of the piece (1 row up, 1 col left)
   *        [-1, 0] which means the vertical direction directly below the piece (1 row down, 0 col lateral)
   * The limit dictates how many squares to check in the given direction. For a king, the limit would be 1.
   * For a bishop/rook/queen, it would be unlimited.
   */
  function findMovePositions(fromPosition, direction, limit) {
    const rowIncrement = direction[0];
    const colIncrement = direction[1];
    const movePositions = [];
    let i = 0;
    let toPosition = calculatePosition(fromPosition, rowIncrement, colIncrement);
    while (i < limit && toPosition !== null) {
      movePositions.push(toPosition);
      toPosition = calculatePosition(toPosition, rowIncrement, colIncrement);
      i++;
    }
    return movePositions;
  }

  function filterMovePositions(movePositions, board, color) {
    const filteredMovePositions = [];
    for (let i = 0; i < movePositions.length; i++) {
      let movePosition = movePositions[i];
      if (isPossibleMoveSquare(board[movePosition], color)) {
        filteredMovePositions.push(movePosition);
      }
      // if square is occupied, no further squares to consider because they are blocked; exit iteration
      if (!isEmptySquare(board[movePosition])) {
        break;
      }
    }
    return filteredMovePositions; 
  }

  function isPossibleMoveSquare(square, color) {
    return isEmptySquare(square) || isOpponentPiece(square, color);
  }

  function isEmptySquare(square) {
    return !square;
  }

  function isOpponentPiece(square, color) {
    return !isEmptySquare(square) && square.color !== color;
  }

  function isCurrentPlayerPiece(square, color) {
    return !isEmptySquare(square) && square.color === color;
  }

  /**
   * Given a square at @fromPosition and desired row/col offsets, returns the new position. 
   * For @rows, negative values denote leftward direction.
   * For @cols, negative values denote downward direction.
   * 
   * NOTE: Returns null if the new position is outside the board boundaries.
   */
  function calculatePosition(fromPosition, rows, cols) {
    const fromRow = findRow(fromPosition);
    const fromCol = findCol(fromPosition);
    const toRow = fromRow + rows;
    const toCol = fromCol + cols;
    // exit if new position is outside board boundaries
    if (toRow < 0 || toRow >= NUM_ROWS || toCol < 0 || toCol >= NUM_COLS) {
      return null;
    }
    return toRow * NUM_ROWS + toCol;
  }

  function findRow(position) {
    return Math.floor(position / NUM_COLS);
  }

  function findCol(position) {
    return position % NUM_COLS;
  }


  //
  // Check functions
  //

  function findKingPosition(color, board) {
    return board.findIndex(s => isCurrentPlayerPiece(s, color) && s.type === PieceTypeEnum.KING);
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
      let opponentPossibleMovePositions = piece.type === PieceTypeEnum.KING
        ? PieceTypeEnum.properties[PieceTypeEnum.KING].findPossibleStandardMovePositions(p, board)
        : PieceTypeEnum.properties[piece.type].findPossibleMovePositions(p, board, previousMoves);

      return opponentPossibleMovePositions.includes(kingPosition);
    });
  }

  /** Given a move @fromPosition --> @toPosition, returns the board state as if that move were executed. */
  function updateBoard(fromPosition, toPosition, board) {
    board[toPosition] = board[fromPosition];
    board[fromPosition] = null;
    return board;
  }


  // 
  // Miscellaneous functions
  //

  function createInitialSquares() {
    const board = Array(NUM_SQUARES).fill(null);

    PIECES_STARTING_ORDER.forEach((p, i) => {
      let blackPiecePosition = i;
      let whitePiecePosition = calculatePosition(blackPiecePosition, 7, 0);
      board[blackPiecePosition] = new Piece(p, ColorEnum.BLACK);
      board[whitePiecePosition] = new Piece(p, ColorEnum.WHITE);

      let blackPawnPosition = calculatePosition(blackPiecePosition, 1, 0);
      let whitePawnPosition = calculatePosition(whitePiecePosition, -1, 0);
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

  function isPawnPromotion(position, board) {
    if (!board[position]) {
      return false;
    }
    const piece = board[position];
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
    findAllValidMovePositions: findAllValidMovePositions,
    isKingChecked: isKingChecked,
    updateBoard: updateBoard,
  }

}()
