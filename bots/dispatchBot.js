// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { CardFactory } = require('botbuilder-core');
const { ActivityHandler } = require('botbuilder');
const { LuisRecognizer, QnAMaker } = require('botbuilder-ai');
const WelcomeCard = require('../resources/welcomeCard.json');
class DispatchBot extends ActivityHandler {
    constructor() {
        super();

        // If the includeApiResults parameter is set to true, as shown below, the full response
        // from the LUIS api will be made available in the properties  of the RecognizerResult
        const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://${ process.env.LuisAPIHostName }.api.cognitive.microsoft.com`
        }, {
            includeAllIntents: true,
            includeInstanceData: true
        }, true);

        const qnaMaker = new QnAMaker({
            knowledgeBaseId: process.env.QnAKnowledgebaseId,
            endpointKey: process.env.QnAEndpointKey,
            host: process.env.QnAEndpointHostName
        });

        this.dispatchRecognizer = dispatchRecognizer;
        this.qnaMaker = qnaMaker;

        this.onMessage(async (context, next) => {
            // cognitive service (LUIS or QnA) 구분
            const recognizerResult = await dispatchRecognizer.recognize(context);

            // Top intent 가 무엇인지 판별
            const intent = LuisRecognizer.topIntent(recognizerResult);

            //  top intent에 따른 디스패처 호출 
            await this.dispatchToTopIntentAsync(context, intent, recognizerResult);

            await next();
        });
        //대화 시작시
        this.onMembersAdded(async (context, next) => {
            const welcomeText = '간단한 문장 혹은 키워드를 입력해주세요!';
            const membersAdded = context.activity.membersAdded;
            const welcomeCard = CardFactory.adaptiveCard(WelcomeCard);

            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity({ attachments: [welcomeCard] });
                    await context.sendActivity(`${ member.name }님  ${ welcomeText }`);
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
    /* 
    Top indent 구분 
    상품추천 : prodRecomend -> LUIS 학습
    상품문의 : ProdInfo
    간단질의 : QnA bot -> 마인드맵을 통한 시나리오 작성
    */
    async dispatchToTopIntentAsync(context, intent, recognizerResult) {
        switch (intent) {
        case 'ProdRecommend':
            await this.processprodRecommend(context, recognizerResult.luisResult);
            break;
        case 'qna':
            await this.processInfo(context, recognizerResult.luisResult);
            break;
        case 'ProdInfo':
            await this.processSampleQnA(context);
            break;
        default:
            await context.sendActivity(` ${ intent }에 대해서 잘 이해하지 못 했어요.`);
            break;
        }
    }

    async processprodRecommend(context, luisResult) {
        console.log('prodRecommend');

        // 상품추천
        const result = luisResult.connectedServiceResult;
        const intent = result.topScoringIntent.intent;
        console.log(result);
        const entities = result.entities[0].entity;
        console.log(entities);
        await context.sendActivity(`${ entities }에 대한 상품추천을 원하시나요?`);
        if (luisResult.entities.length > 0) {
            await context.sendActivity(`${ luisResult.entities.map((entityObj) => entityObj.entity).join('\n\n') }.`);
        }
        console.log(result.entities[0].entity);
        if(intent == '안내' && result.entities.length > 0 ){
            const entity = result.entities[0].role;
            await this.processSampleQnA(context, entity);
        }
    }
    //상품 안내
    async processInfo(context, luisResult) {
        const result = luisResult.connectedServiceResult;
        const topIntent = result.topScoringIntent.intent;

        await context.sendActivity(`상품안내에서 ${ topIntent } 관련을 찾으시는게 맞을까요?`);
        // await context.sendActivity(` ${ luisResult.intents.map((intentObj) => intentObj.intent).join('\n\n') }.`);

        if (luisResult.entities.length > 0) {
            await context.sendActivity(`안내해드릴게요. ${ luisResult.entities.map((entityObj) => entityObj.entity).join('\n\n') }.`);
        }
    }
    // QnA bot
    async processSampleQnA(context) {
        const results = await this.qnaMaker.getAnswers(context);
        if (results.length > 0) {
            await context.sendActivity(`${ results[0].answer }`);
        } else {
            await context.sendActivity('죄송합니다. 더욱 배우고 있는 중 이에요.');
        }
    }
}

module.exports.DispatchBot = DispatchBot;
