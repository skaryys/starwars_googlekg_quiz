<template>
  <Container style="margin-top:2.5rem;">
    <Row>
      <Col xs="12" lg="9">
        <Heading1>
          Star Wars Google KG Quiz
        </Heading1>
        <Paragraph>
          In this quiz game, you must select the right Star Wars Character according to clues which are shown on screen.<br/>You have 4 options, 1 is correct. You have 5 minutes to answer 10 questions.<br>For each correct answer you will gain 1 point. You can also get points if you answer quickly.
        </Paragraph>
        <div style="width: 28rem; margin-bottom: 1.5rem;">
          <input type="text" placeholder="Your name" id="name" class="c-input" />
        </div>
        <a href="javascript:void(0);" class="c-button" v-if="!gameStarted" @click="startGame()">
          START
        </a>
        <div style="border-top: .2rem solid #000000; padding-top: 2rem;" v-if="gameStarted && !gameFinished">
          <Heading2>Question {{ this.currentQuestion + 1 }} - who am I?</Heading2>
          <Row style="margin-bottom: 1.5rem">
            <Col class="xs-12 md-stretch" v-if="indicia.image !== ''">
              <img :src="indicia.image" alt="Question image" />
            </Col>
            <Col>
              <Paragraph>
                <div v-for="clue in indicia.other">
                  <span v-if="clue[0] === 'neo4j://vocabulary#detailedDescription'">
                    {{ replaceName(clue[1], indicia.name) }}
                  </span>
                  <span v-else>
                    {{ translations[clue[0]] }} <strong>{{ clue[1] }}</strong>.
                  </span>
                </div>
              </Paragraph>
            </Col>
          </Row>
          <Row>
              <Col :xs="6" :md="3" class="h-displayFlex" v-for="answer in answers" :key="answer[0].character.value" style="margin-bottom: 2rem; cursor: pointer;">
                <div class="c-card" @click="nextQuestion(answer[1])">
                  <div class="content">
                    {{ answer[0].name.value }}
                  </div>
                </div>
              </Col>
          </Row>
          <Heading3>
            {{ this.minutes }}m {{ this.seconds }}s
          </Heading3>
        </div>
        <div style="border-top: .2rem solid #000000; padding-top: 2rem;" v-if="gameFinished">
          <Heading2>Your score is <strong>{{ score }}</strong>.</Heading2>
          <Paragraph>Thank you for playing this game.</Paragraph>
          <a href="/sw" class="c-button" style="margin-bottom: 1.5rem;">
            Restart game
          </a>
        </div>
      </Col>
      <Col xs="12" lg="3">
        <Heading3>10 best players</Heading3>
        <Paragraph>
          <span v-for="player in scores.slice(0,10)" :key="player.id">
            <strong>{{ player.name }}</strong> / {{ player.score }} points<br>
          </span>
        </Paragraph>
      </Col>
    </Row>
  </Container>
</template>

<style lang="scss" scoped>
.c-card {
  border: .2rem solid transparent;
}

.c-card:hover {
  transition: box-shadow 300ms, border-color 300ms ;
  box-shadow: none;
  border: .2rem solid #7f828b;
}
</style>

<script>
import axios from "axios";

export default {
  layout: "sw",
  data() {
    return {
      gameStarted: false,
      gameFinished: false,
      countDownDate: null,
      minutes: 0,
      seconds: 0,
      questions: [],
      currentQuestion: 0,
      answers: [],
      score: 0,
      scores: [],
      indicia: {
        image: "",
        name: "",
        other: []
      },
      translations: {}
    }
  },
  mounted() {
    this.getScores();
    this.loadTranslations();
  },
  methods: {
    startGame: function() {
      const self = this;

      if (this.$el.querySelector("#name").value.trim() !== "") {
        axios.get('/sw/questions').then(function (response) {
          self.questions = response.data.results;
          self.shuffleArray(self.questions);
          let preAnswers = [];
          axios.get("/sw/answers?node=" + escape(response.data.results[0].character.value)).then(function (response2) {
            response2.data.results.map(answer => {
              preAnswers.push([answer, false]);
            });
            preAnswers.push([response.data.results[0], true]);
            self.answers = preAnswers;
            self.shuffleArray(self.answers);
          });
          self.getIndicia();
        });

        this.gameStarted = true;
        this.countDownDate = new Date(new Date().getTime() + 5 * 60000);

        const timeInt = setInterval(function () {
          const now = new Date().getTime();
          const distance = self.countDownDate - now;
          self.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          self.seconds = Math.floor((distance % (1000 * 60)) / 1000);

          if (distance < 0) {
            clearInterval(timeInt);
            self.finishGame();
          }
        }, 1000);
      } else {
        alert("Fill your name, please.");
      }
    },
    finishGame: function() {
      this.score = this.score + this.minutes;
      this.gameFinished = true;

      axios.post("/sw/score", {name: this.$el.querySelector("#name").value, score: this.score });
      this.getScores();
    },
    nextQuestion: function(correct) {
      if (correct) {
        this.score++;
      }
      if (this.currentQuestion < 9) {
        this.currentQuestion++;
        let preAnswers = [];
        const self = this;
        axios.get("/sw/answers?node="+escape(this.questions[this.currentQuestion].character.value)).then(function (response) {
          response.data.results.map(answer => {
            preAnswers.push([answer, false]);
          });
          preAnswers.push([self.questions[self.currentQuestion], true]);
          self.answers = preAnswers;
          self.shuffleArray(self.answers);
        });
        self.getIndicia();
      } else {
        this.finishGame();
      }
    },
    shuffleArray: function(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    },
    getScores: function() {
      const self = this;
      axios.get("/sw_score.json").then(function(response) {
        self.scores = self.sortJSON(response.data.players, "score", "321");
      });
    },
    sortJSON: function(arr, key, way) {
      return arr.sort(function(a, b) {
        let x = a[key]; let y = b[key];
        if (way === '123') { return ((x < y) ? -1 : ((x > y) ? 1 : 0)); }
        if (way === '321') { return ((x > y) ? -1 : ((x < y) ? 1 : 0)); }
      });
    },
    getIndicia: function() {
      const self = this;
      console.log(encodeURI(this.questions[this.currentQuestion].character.value));
      axios.get("/sw/clues?node="+escape(this.questions[this.currentQuestion].character.value)).then(function(response) {
        const indiciaArray = [];
        let indiciaImage = "";

        response.data.results.map(indicia => {
          if (indicia.p.value === "neo4j://vocabulary#image") {
            indiciaImage = indicia.o.value;
          } else if (indicia.p.value === "neo4j://vocabulary#name") {
            self.indicia.name = indicia.o.value;
          } else {
            if (indicia.p.value !== "neo4j://vocabulary#description" && indicia.p.value !== "neo4j://vocabulary#id" && indicia.p.value !== "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && indicia.p.value !== "neo4j://vocabulary#url" && indicia.p.value !== "neo4j://vocabulary#COLLECTION_FICTIONAL_CHARACTERS_FICTIONAL_UNIVERSE") {
              if (indicia.o.token === "literal") {
                indiciaArray.push([indicia.p.value, indicia.o.value]);
              } else {
                axios.get("/sw/name?node=" + escape(indicia.o.value)).then(function (response2) {
                  indiciaArray.push([indicia.p.value, response2.data.results[0].name.value]);
                });
              }
            }
          }
        })
        self.indicia.other = indiciaArray;
        self.indicia.image = indiciaImage;
      });
    },
    replaceName: function(description, name) {
      const words = name.split(" ");
      let descriptionString = description;
      words.map(word => {
        descriptionString = descriptionString.replace(new RegExp(word, "gi"), "*****");
      });
      return descriptionString;
    },
    loadTranslations: function() {
      const self = this;
      axios.get("/trans.json").then(function(response) {
        self.translations = response.data;
      });
    }
  }
}
</script>
