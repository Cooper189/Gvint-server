function* generateSequence(end, player1, player2) {
    for (let i = 0; i <= end; i++) {
      if (i%2) {
        yield player2
      } else {
        yield player1;
      }
    }
}

module.exports = generateSequence;