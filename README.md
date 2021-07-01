# 금융상품 추천 챗봇

auzure 챗봇 프레임워크를 사용한 챗봇 제작.
dispatcher를 통해 각 질의유형을 파악하고 LUIS 혹은 QnAMaker로 분기

# 개발기간

2020.01 ~ 2020.02


### Overview

This bot uses the Dispatch service to route utterances as it demonstrates the use of multiple LUIS models and QnA maker services to support multiper conversational scenarios.

- [Node.js](https://nodejs.org) version 10.14 or higher

    ```bash
    # determine node version
    node --version
    ```

### Use Dispatch with Mulitple LUIS and QnA Models

To learn how to configure Dispatch with multiple LUIS models and QnA Maker services, refer to the steps found [here](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-tutorial-dispatch?view=azure-bot-service-4.0).

## To try this sample

- Install modules

    ```bash
    npm install
    ```

- Start the bot

    ```bash
    npm start
    ```

## Bot Framework Emulator

[Bot Framework Emulator](https://github.com/microsoft/botframework-emulator) is a desktop application that allows bot developers to test and debug their bots on localhost or running remotely through a tunnel.

- Install the Bot Framework Emulator version 4.3.0 or greater from [here](https://github.com/Microsoft/BotFramework-Emulator/releases)

###  Bot Framework Emulator와 챗봇 연동

- Launch Bot Framework Emulator
- File -> Open Bot
- Enter a Bot URL of `http://localhost:3978/api/messages`
