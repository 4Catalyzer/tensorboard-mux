# TensorBoard Mux

[TensorBoard](https://github.com/tensorflow/tensorboard) multiplexer.

TensorBoard Mux allows running multiple TensorBoard instances on the same URL. This allows groups to set up a shared server that allows accessing multiple log directories.

As with TensorBoard, it is not recommended to expose these servers publicly.

## Usage

```
$ npm i
$ npm run build
$ npm start -- --logdir /tensorflow-logs
```

Then visit `http://localhost:6006/user/experiment` to view the logs at `/tensorflow-logs/user/experiment`.

> **Note:** The above will redirect you to `/user/experiment/-/`. The `/-/` suffix is intentional and required to separate out TensorBoard paths from the log path.

To match the behavior of TensorBoard, TensorBoard Mux serves on host 0.0.0.0 and port 6006 by default. You can configure those with `--host` and `--port`. Use `--host 127.0.0.1` to disable remote serving.

This repository also includes a `Dockerfile` that can be used to build a Docker image.
