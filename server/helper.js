const json = require('../field.json');
const generator = require('./generator');


class BaseField {
    constructor() {
        this.war = [];
        this.warSpecial = [];
        this.warTotalScore = 0,
        this.siege = [];
        this.siegeSpecial = [];
        this.siegeTotalScore = 0;
        this.far = [];
        this.farSpecial = [];
        this.farTotalScore = 0;
    }
}

class AvailableCardsService {
    constructor() {
        this.availableCards = {};
        this.enemyCards = new BaseField();
        this.room = [];
        this.currentHand = {};
        this.currentUsers =[];
        this.generator;
    }



    setCardInField(element, i) {
        switch (element.type) {
            case 'war':
                this.availableCards[i].war.push(this.addSpecials(element, this.availableCards[i].warSpecial));
                break;
            case 'siege':
                this.availableCards[i].siege.push(this.addSpecials(element, this.availableCards[i].siegeSpecial));
                break;
            case 'far':
                this.availableCards[i].far.push(this.addSpecials(element, this.availableCards[i].farSpecial));
                break;
            default:
                break;
        }
    }
    addSpecials(element, items) {
        element.specialPoints = element.basePoints;
        items.forEach((item) => {
            switch (item.cardName) {
                case 'weather':
                    element.specialPoints = 1;
                    break;
                default:
                    break;
            }
        });
        return element;
    }

    userMove() {
        if (this.generator) {
            this.turn = this.generator.next();
        }
    }
    

    addCards(element, item) {
        if (element.nonPlayer) {
            this.availableCards[item][element.specialType].push(element);
            this.availableCards[item][element.type].map(el => this.addSpecials(el, this.availableCards[item][element.specialType]));
        }
        else {
            this.setCards(element, item);
        }
        this.currentHand[item] = this.currentHand[item].filter(item => {
            if (element.cardId !== item.cardId) {
                return item;
            }
        });
    }

    addNewUsers(userId) {
        if (userId) {
            this.availableCards[userId] = new BaseField();
            this.currentHand[userId] = json[userId];
            this.usersTurn = userId;
            this.userMove();
        }
    }

    set usersTurn(user) {
        this.currentUsers.push(user);
        if (this.currentUsers.length === 2) {
            this.generator = generator(99, this.currentUsers[0], this.currentUsers[1]);
        }
    }

    get usersTurn() {
        return this.turn;
    }

    set currentHandCards(items) {
        this.currentHand = items;
    }
    setCards(currentCards, item) {
        if (Array.isArray(currentCards)) {
            currentCards.forEach(element => {
                this.setCardInField(element, item);
            });
        }
        else {
            this.setCardInField(currentCards, item);
        }
    }
    cards(userId) {
        return this.availableCards[userId];
    }
    hand(userId) {
        return this.currentHand[userId];
    }
}
module.exports = AvailableCardsService;
