export const defaultHTML = `<!DOCTYPE html>
<html>
  <head>
    <title>My app</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charset="utf-8">
    <style>
      body {
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        height: 100dvh;
        font-family: "Comic Sans MS", cursive, sans-serif;
        text-align: center;
        background: linear-gradient(-45deg, #e73c7e,rgb(9, 62, 82), #23d5ab);
        background-size: 400% 400%;
        animation: gradient 15s ease infinite;
      }
      @keyframes gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .arrow {
        position: absolute;
        bottom: 32px;
        right: 32px;
        width: 100px;
        transform: rotate(-30deg);
        filter: drop-shadow(0 0 10px #fff);
      }
      h1 {
        font-size: 3rem;
        color: white;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      }
      h1 span {
        color: #f0f0f0;
        font-size: 1.5rem;
        display: block;
        margin-bottom: 1rem;
      }
    </style>
  </head>
  <body>
    <h1>
      <span>I'm so ready to slay this,</span>
      Ask me anything <br />
    </h1>
  </body>
</html>
`;
