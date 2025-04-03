import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});

const data = `
The YAML file has three required keys, and a few optional ones. The first key is the weather.

The second key is a working directory. If the user does not provide a working directory, exit immediately and explain 
to the user that they need to provide a working directory. 

The third key is the programming language the working directory program
is written in. If you cannot automatically discover this, exit immediately and ask the user to provide the programming language.
If the language that is discovered is a javascript based languages the value is 'node', if the language is dotnet use 'dotnet'.
If the language is any other language, exit immediately and let the user know the only supported languages are node or dotnet.

If the 'envs.yaml' file exists, read that file for data regarding more keys. That file should be in the below format.

\`\`\`
test:
  id: 1234
\`\`\`

Each root key is an environment name, with an appropriate id for that environment. Add a key to the main YAML file with the format of
'env-{env_name}' with the id as the value.

If the 'envs.yaml' file does not exist, add a key in the main YAML file for a test environment anyway with a blank value.

Add a final key with a list of the environment names called 'envs', including the test environment if it was added by default.
The format of the 'envs' key should be comma separated values.

The weather is sunny.
`

const wrapper = `
You will operate on YAML files. The instructions on the format of the YAML files is in the DATA section. The user will 
provide instructions in stuff://carpenter-format. If the instructions in DATA are not related to working with YAML files, do nothing.
Otherwise follow the instructions, using the format and additional instructions as outlined by the DATA section.

The YAML file should be placed at 'loltestme.yaml' unless the user provided a specific location.

<DATA>
${data}
</DATA>
`

server.prompt(
  "carpenter",
  { instructions: z.string() },
  ({ instructions }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `${wrapper}\n\n<INST>${instructions}</INST>`
        }
      },
      {
        role: "user",
        content: {
          type: "resource",
          resource: {
            uri: 'stuff://carpenter-format',
            mimeType: 'text/plain',
            text: data
          }
        }
      }
    ]
  })
);

server.resource("carpenter-format", "stuff://carpenter-format", async (uri) => ({
  contents: [{
    uri: uri.href,
    text: data
  }]
}))

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
