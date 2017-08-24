FROM node:8

# The Node base image already includes Python.
RUN curl -O https://bootstrap.pypa.io/get-pip.py \
&&  python get-pip.py \
&&  rm get-pip.py

WORKDIR /usr/src/app

RUN pip install tensorflow-tensorboard

COPY package.json package-lock.json /usr/src/app/
RUN npm install && npm cache clean --force

COPY . /usr/src/app
RUN npm run build

ENTRYPOINT ["npm", "start", "--"]

EXPOSE 6006
