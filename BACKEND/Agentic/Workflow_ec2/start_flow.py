""""
missing --  custom tools, deligator, logging, error handling. make sure each .execute() method returns a dict with status and message
"""

from tools.dynamo import db_client
import json
from tools.tool_classes import *  # Import all tool classes dynamically
from Workflow_ec2.oth_tools import *
from prompts import llm_sys_chain,iterator_chain,gemini_chain
import inspect
import logging
from celery import Celery
import redis
import asyncio
from datetime import datetime
celery_app = Celery("tasks", broker="redis://localhost:6379/0", backend="redis://localhost:6379/0")
redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

# Configure logging
logging.basicConfig(
    filename='/home/aryan/BABLU/Agentic/Workflow_ec2/workflow.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)


@celery_app.task
def syn(wid,workflow_json, clerk_id, trigger_output):
    asyncio.run(execute_workflow(wid,workflow_json, clerk_id, trigger_output))

async def execute_workflow(wid,workflow_json, user_id, tr_o=None,dfn=None):
    
    print("EXECUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUTTTTTTTTTTTINGGGGGGGGGGGG")
    if dfn==None:
        
        data_flow_notebook = {"trigger_output": tr_o}
    else:
        data_flow_notebook = dfn
    composio_tools = {cls.__name__.lower(): cls for cls in globals().values() if isinstance(cls, type)}
    # logging.info("Initialized composio_tools: %s", composio_tools)
    if isinstance(workflow_json, str):
        try:
            workflow_json = json.loads(workflow_json)
        except json.JSONDecodeError as e:
            logging.error("Invalid JSON format: %s", e)
            return {"status": "error", "message": "Invalid JSON format"}
    for agent in workflow_json:
        response=""
        status="executed successfully"
        agent_id = agent["id"]
        agent_type = agent["type"]
        agent_name = agent["name"].lower()
        to_execute = agent["to_execute"]
        data_flow_inputs = agent.get("data_flow_inputs", [])
        data_flow_outputs = agent.get("data_flow_outputs", [])
        config_inputs = agent.get("config_inputs", {})
        
        logging.info("Processing agent: %s, Type: %s", agent_name, agent_type)
        
        # Check execution conditions
        if to_execute:
            condition_key, expected_value = to_execute
            print("condition_key",condition_key)
            print("expected_value",expected_value)
            if (data_flow_notebook.get(condition_key) == "Y" and expected_value == 'Y') or \
               ( data_flow_notebook.get(condition_key) == "N" and expected_value == 'N'):
                pass
            else:
                logging.info("Skipping agent %s due to execution condition mismatch", agent_name)
                continue
        try:
            input_data = {key: data_flow_notebook[key] for key in data_flow_inputs}
            logging.info("Input data for agent %s: %s", agent_name, input_data)
        except KeyError as e:
            input_data = {}
            logging.error("Missing data flow inputs key: %s", e)
            continue
        
        # LLM Agent Execution
        if agent_type == "llm":
            system_prompt = agent["llm_prompt"]
            logging.info("Executing LLM agent: %s with prompt: %s", agent_name, system_prompt)
            # logging.info("Config inputs: %s, Input data: %s", config_inputs, input_data)
            # logging.info("yayyyyy %s", input_data.update(config_inputs))  
            response = llm_sys_chain.invoke({"data": {k: v for k, v in list(config_inputs.items()) + list(input_data.items())}, "question": system_prompt, "keys": data_flow_outputs})
            logging.info("LLM response: %s", response)
            try:
                if response[0]=="`":
                    response = response[7:-4]
                    print("response",response)
                    response = json.loads(response)
                else:
                    response = json.loads(response)
                
                data_flow_notebook.update(response)
            except Exception as e:
                status="failed"
                logging.error("Error processing LLM response: %s", e)
        
        # Connector Execution
        elif agent_type == "connector":
            logging.info("Executing connector agent: %s", agent_name)
            if "iterator" in agent_name:
                elements = data_flow_notebook[data_flow_inputs[0]]
                if not isinstance(elements, list):
                    try:
                        
                        elements = iterator_chain.invoke({"data": elements})
                    except KeyError:
                        elements = iterator_chain.invoke({"data": {k: v for k, v in list(config_inputs.items()) + list(input_data.items())}})

                    try:
                        if elements[0] == "`":
                            elements = json.loads(elements[7:-4])
                        else:
                            elements = json.loads(elements)
                        for element in elements:
                            data_flow_notebook[data_flow_outputs[0]] = element
                            await execute_workflow(wid, workflow_json[agent_id:], user_id, tr_o, data_flow_notebook)
                    except Exception as e:
                        status="failed"
                        logging.error("Error in iterator processing: %s", e)
                else:
                    for element in elements:
                        print("element",element)
                        data_flow_notebook[data_flow_outputs[0]] = element
                        await execute_workflow(wid, workflow_json[agent_id:], user_id, tr_o, data_flow_notebook)

            elif "validator" in agent_name:
                system_prompt = agent["validation_prompt"]
                logging.info("Executing validator agent: %s", agent_name)
                response = llm_sys_chain.invoke({"data": {k: v for k, v in list(config_inputs.items()) + list(input_data.items())}, "question": system_prompt + "\nwrite Y as value for given key if validation criteria meets, else write N", "keys": data_flow_outputs})
                try:
                    if response[0] == "`":
                        response = json.loads(response[7:-4])
                    else:
                        response = json.loads(response)
                    data_flow_notebook.update(response)
                except Exception as e:
                    status="failed"
                    logging.error("Error processing validator response: %s", e)
            elif "delegator" in agent_name:
                status="failed"
                logging.info("Delegator agent: %s has no action specified", agent_name)
        
        # Tool Execution
        elif agent_type == "tool":
            logging.info("Executing tool agent: %s", agent_name)
            user_data = db_client.get_item(
                        TableName="users",
                        Key={"clerk_id": {"S": user_id}}
            )
            api_key = user_data.get("Item", {}).get("api_key", {}).get("M", {})
            api_keys = {k: v['S'] for k, v in api_key.items()}
            comp = api_keys["composio"]
            # gem=api_keys["gemini"]
            if agent_name in composio_tools:
                try:
                    
                    method = getattr(composio_tools[agent_name], agent.get("tool_action", ""))

                    # Get function signature
                    signature = inspect.signature(method)

                    inputs = [{name: param.default if param.default is not inspect.Parameter.empty else None}
                              for name, param in signature.parameters.items()]
                    print("inputs",inputs,"input_data",input_data,"config_inputs",config_inputs)
                    print(f"You are an input validator for a function. Convert the given inputs to a dictionary format, with keys as parameter names of the function and values as the corresponding input values in proper required format. strictly convert the input parameters to required format. The given data might be in natural language, but you need to make sure you are extracting exact information in proper format from given data. If a parameter is not provided, set it to most relevant value . Return the dictionary in JSON format. No preambles or postambles. keep all strings in double quotes.\nInput parameter names and their explaination:{inputs[1:]}\ndata:"+str({k: v for k, v in list(config_inputs.items()) + list(input_data.items())}))
                    to_go = gemini_chain.invoke({"prompt": f"You are an input validator for a function. Convert the given inputs to a dictionary format, with keys as parameter names of the function and values as the corresponding input values in proper required format. strictly convert the input parameters to required format. The given data might be in natural language, but you need to make sure you are extracting exact information in proper format from given data. STRICTLY DON'T GIVE ANY OTHER KEY, OTHER THAN INPUT PARAMETERS OF FUNCTION. If a parameter is not provided, set it to most relevant value . Return the dictionary in JSON format. No preambles or postambles. keep all strings in double quotes.\nInput parameter names and their explaination:{inputs[1:]}\ndata to insert (don't skip anything. each of the following data should go into some parameter values):"+str({k: v for k, v in list(config_inputs.items()) + list(input_data.items())})})
                    if to_go[0] == "`":
                        to_go = json.loads(to_go[7:-4])
                    else:
                        to_go = json.loads(to_go)
                    kwargs = {"action": agent.get("tool_action", ""), **to_go}
                    print("kwargs",kwargs)
                    tool_obj = composio_tools[agent_name](comp, kwargs)
                    response = tool_obj.execute()
                    
                    # response = llm_sys_chain.invoke({"data": response, "question": agent["description"], "keys": data_flow_outputs})
                    # if response[0] == "`":
                    #     response = json.loads(response[7:-4])
                    # else:
                    #     response = json.loads(response)
                    # data_flow_notebook.update(response)
                    for keys in data_flow_outputs:
                        data_flow_notebook[keys] = response
                except Exception as e:
                    status="failed"
                    logging.error("Error executing tool agent %s: %s", agent_name, e)
            else:
                # Check if a standalone function matches the agent_name.upper()                                                                                                             
                if agent_name.upper() in globals() and callable(globals()[agent_name.upper()]):
                    try:
                        standalone_function = globals()[agent_name.upper()]
                        
                        # Get function signature
                        signature = inspect.signature(standalone_function)
                        inputs = [{name: param.default if param.default is not inspect.Parameter.empty else None}
                                  for name, param in signature.parameters.items()]
                        print("inputs",inputs,"input_data",input_data,"config_inputs",config_inputs)
                        # Perform input validation
                        to_go = gemini_chain.invoke({"prompt": f"You are an input validator for a function. Convert the given inputs to a dictionary format, with keys as parameter names of the function and values as the corresponding inputs in proper required format. strictly convert the input parameters to required format. The given data might be in natural language, but you need to make sure you are extracting exact information in proper format from given data. STRICTLY DON'T GIVE ANY OTHER KEY, OTHER THAN INPUT PARAMETERS OF FUNCTION. If a parameter is not provided, set it to most relevant value . Return the dictionary in JSON format. No preambles or postambles. keep all strings in double quotes.\nInput parameter names (REQUIRED KEYS) and their explaination:{inputs}\ndata including values for given keys above:"+str({k: v for k, v in list(config_inputs.items()) + list(input_data.items())})})
                        try:
                            if to_go[0] == "`":
                                to_go = json.loads(to_go[7:-4])
                            else:
                                to_go = json.loads(to_go)
                        except:
                            to_go=eval(to_go)
                        
                        # Call the standalone function
                        logging.info("%s",to_go)
                        response = standalone_function(**to_go)
                        
                        # Perform output validation
                        logging.info("Response from standalone function: %s", response)
                        # response = llm_sys_chain.invoke({"data": response, "question": agent["description"], "keys": data_flow_outputs})
                        # if response[0] == "`":
                        #     response = json.loads(response[7:-4])
                        # else:
                        #     response = json.loads(response)
                        # data_flow_notebook.update(response)
                        for keys in data_flow_outputs:
                            data_flow_notebook[keys] = response
                    except Exception as e:
                        status="failed"
                        logging.error("Error executing standalone function %s: %s", agent_name.upper(), e)
                else:
                    status="tool unavailable"
        logging.info("Data flow notebook:%s", data_flow_notebook)
                

        # redis_client.publish(f"workflow_{user_id}", json.dumps(data_flow_notebook))
        if type(response) == str:
            response={"response": response}
        redis_client.publish(f"workflow_{user_id}", json.dumps({
                    "workflow_id": wid,
                    "node": agent_id,
                    "agent_name": agent_name,
                    "status": status,
                    "timestamp": datetime.now().isoformat(),
                    "data": response
                }))  
       
    return {"status": "success", "data": data_flow_notebook}












