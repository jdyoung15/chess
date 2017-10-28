var Chess = function() {

  function isEven(num) {
    return num % 2 === 0;
  }

  function isAlternateSquare(position) {
    const row = Math.floor(position / 8);
    if (isEven(row)) {
      // if row is even and position is odd: true
      return !isEven(position);
    } else {
      // if row is odd and position is even: true
      return isEven(position);
    }
  }

  return {
    isAlternateSquare: isAlternateSquare
  }

}()
