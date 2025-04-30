# Installation Guide

Follow these steps to set up the development environment:

1. Install NVM (Node Version Manager):
```shell
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 22.14.0
nvm use 22.14.0
npm install -g yarn
yarn install
yarn dev
npm install codemirror@5
yarn add react-codemirror2
```