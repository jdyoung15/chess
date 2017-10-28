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
      1: {name: "pawn", value: 1},
      2: {name: "knight", value: 2},
      3: {name: "bishop", value: 3},
      4: {name: "rook", value: 4},
      5: {name: "queen", value: 5},
      6: {name: "king", value: 6}
    }
  };

  function findPieceImgName(type, color) {
    return "images/" + PieceTypeEnum.properties[type].name + "-" + ColorEnum.properties[color].name + ".png";
  }

  //function isEven(num) {
  //  return num % 2 === 0;
  //}

  return {
    ColorEnum: ColorEnum,
    PieceTypeEnum: PieceTypeEnum,
    findPieceImgName: findPieceImgName
  }

}()
