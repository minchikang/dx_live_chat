// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler } = require('botbuilder');
const { LuisRecognizer, QnAMaker } = require('botbuilder-ai');

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
            console.log('Processing Message Activity.');

            // First, we use the dispatch model to determine which cognitive service (LUIS or QnA) to use.
            const recognizerResult = await dispatchRecognizer.recognize(context);

            // Top intent tell us which cognitive service to use.
            const intent = LuisRecognizer.topIntent(recognizerResult);

            // Next, we call the dispatcher with the top intent.
            await this.dispatchToTopIntentAsync(context, intent, recognizerResult);

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const welcomeText = 'Type a greeting or a question about the weather to get started.';
            const membersAdded = context.activity.membersAdded;

            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity(`Welcome to Dispatch bot ${ member.name }. ${ welcomeText }`);
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async dispatchToTopIntentAsync(context, intent, recognizerResult) {
        switch (intent) {
        case 'ProdRecommend':
            await this.processHomeAutomation(context, recognizerResult.luisResult);
            break;
        case 'qna':
            await this.processWeather(context, recognizerResult.luisResult);
            break;
        case 'ProdInfo':
            await this.processSampleQnA(context);
            break;
        default:
            console.log(`Dispatch unrecognized intent: ${ intent }.`);
            await context.sendActivity(`Dispatch unrecognized intent: ${ intent }.`);
            break;
        }
    }

    async processHomeAutomation(context, luisResult) {
        console.log('prodRecommend');

        // Retrieve LUIS result for Process Automation.
        const result = luisResult.connectedServiceResult;
        const intent = result.topScoringIntent.intent;
        console.log(result);
        const entities = result.entities[0].entity;
        console.log(entities);
        // await context.sendActivity(`상품추천 top intent ${ intent }.`);
        // await context.sendActivity(`상품추천 intents detected:  ${ luisResult.intents.map((intentObj) => intentObj.intent).join('\n\n') }.`);
        await context.sendActivity(`${ entities }에 대한 상품추천을 원하시나요?`);
        console.log(luisResult.entities);
        if (luisResult.entities.length > 0) {
            console.log(luisResult.entities);
            await context.sendActivity(`HomeAutomation entities were found in the message: ${ luisResult.entities.map((entityObj) => entityObj.entity).join('\n\n') }.`);
        }
        console.log(result.entities[0].entity);
        if(intent == '안내' && result.entities.length > 0 ){
            console.log('안내~~~~~');
            console.log('결과'+ result);
            const entity = result.entities[0].role;
            console.log('entities:' + entity);

            // await this.processSampleQnA(entity)
            await this.processSampleQnA(context, entity);
        }
    }

    async processWeather(context, luisResult) {
        console.log('prodInfo');

        // Retrieve LUIS results for Weather.
        const result = luisResult.connectedServiceResult;
        const topIntent = result.topScoringIntent.intent;

        await context.sendActivity(`상품안내 top intent ${ topIntent }.`);
        await context.sendActivity(`상품안내 intents detected:  ${ luisResult.intents.map((intentObj) => intentObj.intent).join('\n\n') }.`);

        if (luisResult.entities.length > 0) {
            await context.sendActivity(`ProcessWeather entities were found in the message: ${ luisResult.entities.map((entityObj) => entityObj.entity).join('\n\n') }.`);
        }
    }

    async processSampleQnA(context) {
        console.log('========prodInfo==========');
        console.log(context);
        console.log('========위에context');
        // context._turnState.push(entity);
        console.log(context);
        const results = await this.qnaMaker.getAnswers(context);
        console.log(results[0]);
        console.log('===== resluts [0] =======');
        console.log(results.length);

        if (results.length > 0) {
            console.log("==========");
            await context.sendActivity(`${ results[0].answer }`);
        } else {
            console.log("-------??")
            // await context.sendActivity('Sorry, could not find an answer in the Q and A system.');
        }
    }
}

module.exports.DispatchBot = DispatchBot;
