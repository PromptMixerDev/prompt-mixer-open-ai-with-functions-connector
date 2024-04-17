# Prompt Mixer OpenAI with Function calling Connector

This is a connector for Prompt Mixer that allows you to access the OpenAI API from within Prompt Mixer. It includes a testing function that simulates a database request returning a user list from the database.

## Features
- Connect to the OpenAI API and use various models to generate text, code, images, and more
- Pass prompts and settings to the OpenAI API with just a few clicks
- Output is displayed directly in Prompt Mixer
- Test OpenAI functions to ensure they work as expected
- Includes a testing function that simulates a database request returning a user list from the database

## Installation
To install:

- In Prompt Mixer go to Connectors > All Connectors
- Go to Connectors > Installed > OpenAI with Function calling to configure your API key

## Usage
After installing and configuring your API key, you can start using any OpenAI model through the assistant panel in Prompt Mixer.

### Function Calling
During an API call, you can specify functions which the model will use to intelligently generate a JSON object. This object contains the necessary arguments for calling one or several functions. Note that the Chat Completions API will not execute these functions; it merely creates the JSON for you to use in your function calls within your own code.

For more details on how this works, consult the OpenAI documentation: https://platform.openai.com/docs/guides/function-calling

To test your functions, please fork this repository, then add and describe your functions.

## Contributing
Pull requests and issues welcome! Let me know if you have any problems using the connector or ideas for improvements.

For guidance on building your own connector, refer to this documentation: https://docs.promptmixer.dev/tutorial-extras/create-a-custom-connector

## License
MIT
