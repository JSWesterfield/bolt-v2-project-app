// const { App, ExpressReceiver, WorkflowStep, LogLevel } = require('@slack/bolt');
// const express = require('serverless-express/express');
const { App, AwsLambdaReceiver, LogLevel } = require('@slack/bolt');
var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
var lambda = new AWS.Lambda();

// const { createIncidentForm, createMitigatedIssueForm } = require('./modals/createForms.js'); // grab raise broadcast issue incident or issue mitigated modals
const moment = require('moment');

const nowDate = moment().format('YYYY-MM-DD');
const nowTime = moment().format('HH:mm');

// Initialize your custom receiver, new
const awsLambdaReceiver = new AwsLambdaReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// declare our app
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    logLevel: LogLevel.DEBUG,
    receiver: awsLambdaReceiver,

    // When using the AwsLambdaReceiver, processBeforeResponse can be omitted.
    // If you use other Receivers, such as ExpressReceiver for OAuth flow support
    // then processBeforeResponse: true is required. This option will defer sending back
    // the acknowledgement until after your handler has run to ensure your function
    // isn't terminated early by responding to the HTTP request that triggered it.

    // processBeforeResponse: true
});

// Verify the Challenge
// app.post('/events', (req, res) => {
//     console.log('44: Inside app.post');
//     console.log(`45: Our request: ${req}`);

//     switch (req.body.type) {
//         case 'url_verification': {
//             // verify Events API endpoint by returning challenge if present
//             // test change
//             res.send({challenge: req.body.challenge});
//             console.log(' /events challenge verification works!');
//             break;
//         }
//         default: {
//             res.sendStatus(500);
//             console.log(' /events challenge verification DOES NOT WORK!! NOOOOO!');
//         }
//     }
// });

// New comment to deploy to AWS, delete later

app.shortcut('raise_an_incident_form', async ({ ack, payload, client }) => {
    ack();
    const clientPayload = JSON.stringify(client.token);
    const requesterUserIdPayload = payload['user']['id'];
    const totalShortcutPayload = JSON.stringify(payload);
    const requestorArr = [];
    requestorArr.push(requesterUserIdPayload);
    
    const result = await client.views.open({
        trigger_id: payload.trigger_id,
        view: {
            "title": {
                "type": "plain_text",
                "text": "Raise an Incident",
                "emoji": true
            },
            "submit": {
                "type": "plain_text",
                "text": "Submit",
                "emoji": true
            },
            "type": "modal",
            "callback_id": "view_raise_incident_form", 
            "close": {
                "type": "plain_text",
                "text": "Cancel",
                "emoji": true
            },
            "blocks": [
                {   
                    "block_id": "block-id-urgency",
                    "type": "input",
                    "element": {
                        "type": "static_select",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "Select an Urgency",
                            "emoji": true
                        },
                        "options": [
                            {
                                "text": {
                                    "type": "plain_text",
                                    "text": "Critical (Live Impacting) :red_circle: ",
                                    "emoji": true
                                },
                                "value": "Critical (Live Impacting) :red_circle: "
                            },
                            {
                                "text": {
                                    "type": "plain_text",
                                    "text": "High (Will impact live soon if not fixed) :large_yellow_circle:",
                                    "emoji": true
                                },
                                "value": "High (Will impact live soon if not fixed) :large_yellow_circle:"
                            },
                            {
                                "text": {
                                    "type": "plain_text",
                                    "text": "Low (If workaround is available) :white_circle:",
                                    "emoji": true
                                },
                                "value": "Low (If workaround is available) :white_circle: "
                            },
                        ],
                        "action_id": "static_select-action_sn_request"
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Urgency",
                        "emoji": true
                    }
                },
                {
                    "type": "divider"
                },
                {
                    "block_id": "block-id-incident-summary",
                    "type": "input",
                    "element": {
                        "type": "plain_text_input",
                        "multiline": true,
                        "action_id": "plain_text_input-action_sn_request"
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Summary of Incident",
                        "emoji": true
                    }
                },
                {
                    "type": "divider"
                },
                {
                    "block_id": "block-id-issue-location",
                    "type": "input",
                    "element": {
                        "type": "plain_text_input",
                        "multiline": false,
                        "action_id": "plain_text_input-action_sn_request"
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Location of Issue (E.G: LTH London, MCR Paris, etc.)",
                        "emoji": true
                    }
                },
                {
                    "type": "divider"
                },
                {
                    "block_id": "block-id-date",
                    "type": "input",
                    "element": {
                        "type": "datepicker",
                        "action_id": "datepicker-action-sn-request",
                        "initial_date": nowDate, // moment.js adds current date when users opens modal 
                        "placeholder": {
                            "type": "plain_text",
                            "text": "Select a date",
                            "emoji": true
                        }
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Date & Time of issue",
                        "emoji": true
                    }
                },
                {
                    "type": "divider"
                },
                {
                    "block_id": "block-id-time",
                    "type": "input",
                    "element": {
                        "type": "timepicker",
                        "action_id": "timepicker-action-sn-request",
                        "initial_time": nowTime, // moment.js adds current date when users opens modal 
                        "placeholder": {
                            "type": "plain_text",
                            "text": "Select a Time(down to minutes)",
                            "emoji": true
                        }
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Time of issue(down to minutes)",
                        "emoji": true
                    }
                },
                {
                    "type": "divider"
                },
                {
                    "block_id": "block-id-issue-impact-summary",
                    "type": "input",
                    "element": {
                        "type": "plain_text_input",
                        "multiline": false,
                        "action_id": "plain_text_input-action_sn_request"
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "System which seems to be affected",
                        "emoji": true
                    }
                },
                {
                    "type": "divider"
                },
                {
                    "block_id": "block-id-additional-issues",
                    "type": "input",
                    "element": {
                        "type": "plain_text_input",
                        "multiline": true,
                        "action_id": "plain_text_input-action_sn_request"
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Additional details (Please provide any other information to help troubleshoot this issue)",
                        "emoji": true
                    }
                },
                {
                    "type": "divider"
                },
                {
                    "block_id": "block-id-requestor",
                    "type": "input",
                    "element": {
                        "type": "multi_users_select",
                        "initial_users": requestorArr,
                        "max_selected_items": 1,
                        "placeholder": {
                            "type": "plain_text",
                            
                            "text": "Select users",
                            "emoji": true
                        },
                        "action_id": "multi_users_select-action_sn_request"
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Opened By/Requestor",
                        "emoji": true
                    }
                },
            ]
        }
    });
    console.log('251: Inside App.shortcut, going into app.view now...');
    // console.log(result);

});

app.view('view_raise_incident_form', async ({ ack, body, view, client, logger }) => {
    await ack();

    const channelID = 'C02UQ84BXFZ'     // #test-wfb-slack-cli-notifications
    const user = body['user'];
    const userName = body['user']['name'];
    const bodyJson = body;
    const bodychannelJson = body['channel']
    const viewState = view['state']
    const userRequestor = view.state.values['block-id-requestor']['multi_users_select-action_sn_request']['selected_users'][0];
    const issueLocation = view.state.values['block-id-issue-location']['plain_text_input-action_sn_request']['value']
    const dateVal = view.state.values['block-id-date']['datepicker-action-sn-request']['selected_date'];
    const timeVal = view.state.values['block-id-time']['timepicker-action-sn-request']['selected_time'];
    const systemImpacted = view.state.values['block-id-issue-impact-summary']['plain_text_input-action_sn_request']['value']
    const urgency = view.state.values['block-id-urgency']['static_select-action_sn_request']['selected_option']['value'];
    const summary = view.state.values['block-id-incident-summary']['plain_text_input-action_sn_request']['value']
    const additionalDetails = view.state.values['block-id-additional-issues']['plain_text_input-action_sn_request']['value']
        
    const selectedDate = moment(dateVal).format('L');
    const DateTimeConCat = `${selectedDate}`+` | `+`${timeVal}`;

    let channel_msg = '';
    let thread_msg = '';
    let resolved_modal_msg = '';

    if (viewState) {
        // DB save was successful
        channel_msg = 
            `<@${userRequestor}>, reported an issue with \`${summary}\` | *Urgency:* ${urgency} `,
        thread_msg = `Hello <@${userRequestor}>,
        Thank you for submitting your issue! \`@toc\`, \`@toc-lead\` & \`@mts-technician\` 
        will be notified and will acknowledge with a PD Incident shortly.

        When you are able to, add the following to this thread to assist in triage: \n
        1️. What service or channel is affected?\n
        2️. When did the incident start? If not immediately, when will there be an impact?\n
        3️. What systems (devices or applications) seem to be impacted?\n
        4️. Is there a workaround in place or that can be used to mitigate the incident?\n
        5️. What is the location of the incident? (e.g. which Market)\n
        6️. Was there any change activity around that time?\n

        Include any attachments/pics under this thread for easy tracking.\n

            ▪️ Reported by: <@${userName}>\n
            ▪️ Location of Issue: \`${issueLocation}\`\n
            ▪️ Date & Time (UTC): \`${DateTimeConCat}\`\n
            ▪️ System which seems to be affected: \`${systemImpacted}\`\n
            ▪️ Other/Additional information: \`${additionalDetails}\`\n

        `,
        resolved_modal_msg = `Hey <@${userName}>, When the issue is resolved. Please fill out this form.
        `
    } else {
        channel_msg = 'There was an error with your submission';
    }

    try {
        const result = await client.chat.postMessage({
            // channel: user, // if we wanted to message the user directly
            channel: channelID,
            text: channel_msg,
        });

        const ts = result.ts;
        const id = result.channel;
        const texts = result.message.text;

        // Create data obj for AWS Lambda Function to consume
        let formData = {
            "userRequestor": userRequestor,
            "issueLocation": issueLocation,
            "dateVal": dateVal,
            "timeVal": timeVal,
            "systemImpacted": systemImpacted,
            "urgency": urgency,
            "summary": summary,
            "additionalDetails": additionalDetails,
            "thread_ts": ts,
        }

        let data = JSON.stringify(formData); //set var to the parms.Payload's value
        console.log(`Our form data: ${data}`) // show our newFormData to see what were passing into sendFormData Function

        replyMessage(id,ts)
        replyModule(id,ts) 
        // sendFormData(data) // not needed, just add invoke lambda function below
        setTimeout( sendFormData(data), 3000);

    }
    catch (error) {
        logger.error(error);
    } 
    
    async function replyMessage(id, ts) {
        try {
            let text = thread_msg;

            const result2 = await app.client.chat.postMessage({
                token: process.env.SLACK_BOT_TOKEN,
                channel: id,
                thread_ts: ts,
                text: text,
                
            });
        
        } catch (error) {
            console.error(error);
        }
    }

    async function replyModule(id, ts) {
        try {
            let text = resolved_modal_msg;
            const result3 = await app.client.chat.postMessage({
                token: process.env.SLACK_BOT_TOKEN,
                channel: id,
                thread_ts: ts,
                attachments: [
                    {
                        "blocks": [
                            {
                                "type": "section",
                                "text": {
                                    "type": "mrkdwn",
                                    "text": "*Issue Mitigated Form*\n"
                                },
                                accessory: {
                                    type: 'button',
                                    text: {
                                        type: 'plain_text',
                                        text: 'Open Form'
                                    },
                                    action_id: 'issue_mitigated_button_selected'
                                }
                            },
                            
                        ]
                    }
                ],
                // block: [{"type": "section", "text": {"type": "plain_text", "text": "Hey! This is a Block!"}}],
                text: text,
            });

            try {

            } catch {

            }

        } catch (error) {
            console.error(error);
        }
    }

    async function sendFormData(data) {
        console.log('-----');
        console.log('1');
        console.log('Inside sendFormData, heres our sendFormData data object were passing in: ');
        console.log(data); // what does this return? Update: correct data object
        console.log('-----');
        try { 
            // let data = this.data; //set var to the parms.Payload's value
            
            // Push data to other AWS Lambda function. 
            console.log('-----');
            console.log('2');
            console.log('Inside try catch, heres our sendFormData data object were passing in: ');
            console.log(data); // what does this return? Update: correct data object
            console.log('Invoking Lambda, please standby...');
            console.log('-----');
            var params = {
                FunctionName: 'Lambda_Bv2', // the lambda function we are going to invoke
                InvocationType: 'RequestResponse',
                LogType: 'Tail',
                Payload: data
                // Payload: '{ "name" : "this is params.Payload, my name is Jake W." }'
            };
    
            lambda.invoke(params, function(err, data) {
                console.log('-----');
                console.log('3');
                console.log('Inside lambda.invoke, heres our lambda.invoke data object were passing in: ');
                // let payloadData = params.Payload;
                console.log(params.Payload); // what does this return? undefined
                console.log('-----');
                
                if (err) {
                    console.log(err);
                    //context.fail(err);
                } else {
                    // console.log('-----');
                    console.log('4');

                    // console.log('Lambda_B said '+ data);
                console.log('Lambda_B also said '+ params.Payload);
                    console.log('-----');
                    //context.succeed('Lambda_B said again'+ data.Payload);
                }
            });

        } catch (error) {
            console.error(error);
        }
    }

});

app.action('issue_mitigated_button_selected', async ({ ack, body, payload, client, logger }) => { 
    await ack();
    console.log('412 In app.action ');
    try {
        const result = await client.views.open({
            trigger_id: body.trigger_id,
            view: {
                type: 'modal',
                callback_id: 'view_issue_mitigated_form',
                title: {
                    type: 'plain_text',
                    text: 'Issue Mitigated'
                },
                blocks: [
                    {
                        "block_id": "block-id-date-resolution",
                        "type": "input",
                        "element": {
                            "type": "datepicker",
                            "action_id": "action-id-date-resolution",
                            "initial_date": nowDate, // moment.js adds current date when users opens modal 
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Select a date",
                                "emoji": true
                            }
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "Date of Resolution",
                            "emoji": true
                        }
                    },
                    {
                        "block_id": "block-id-time-resolution",
                        "type": "input",
                        "element": {
                            "type": "timepicker",
                            "action_id": "action-id-time-resolution",
                            "initial_time": nowTime, // moment.js adds current date when users opens modal 
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Select a Time(down to minutes)",
                                "emoji": true
                            }
                        },
                        "label": {
                            "type": "plain_text",
                            "text": `Time of Resolution(HH:MM in UTC)`,
                            "emoji": true
                        }
                    },
                    {   
                        "block_id": "block-id-resolution-selection",
                        "type": "input",
                        "element": {
                            "type": "static_select",
                            "action_id": "action-id-resolution-selection",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Select an option",
                                "emoji": true
                            },
                            "options": [
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "Resolved ",
                                        "emoji": true
                                    },
                                    "value": "Resolved"
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "Workaround",
                                        "emoji": true
                                    },
                                    "value": "Workaround"
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "Not a technical issue",
                                        "emoji": true
                                    },
                                    "value": "Not a technical issue"
                                },
                            ],
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "Resolution or Workaround?",
                            "emoji": true
                        }
                    },
                    {
                        "block_id": "block-id-team-fix-resolution",
                        "type": "input",
                        "element": {
                            "type": "plain_text_input",
                            "action_id": "action-id-team-fix-resolution",
                            "multiline": false,
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Team Name",
                                "emoji": true
                            }
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "Which team fixed the issue?",
                            "emoji": true
                        }
                    },
                    {
                        "block_id": "block-id-impa-dura-date-resolution",
                        "type": "input",
                        "element": {
                            "type": "plain_text_input",
                            "action_id": "action-id-impa-dura-date-resolution",
                            "multiline": false,
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Elapsed hrs in HH:MM UTC format",
                                "emoji": true
                            }
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "Impact duration - From start of issue raised to when confirmed fixed (HH:MM in UTC))",
                            "emoji": true
                        }
                    },
                    {
                        "block_id": "block-id-details-resolution",
                        "type": "input",
                        "element": {
                            "type": "plain_text_input",
                            "action_id": "action-id-details-resolution",
                            "multiline": true,
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Resolution details",
                                "emoji": true
                            }
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "Details of resolution:",
                            "emoji": true
                        }
                    },
                ],
                submit: {
                    type: 'plain_text',
                    text: 'Submit'
                }
            }
        });

        logger.info(result);
    } catch (error) {
        logger.error(error);
    }
});

app.view('view_issue_mitigated_form', async ({ ack, body, view, client, logger }) => {
    await ack();
    // console.log('618: inside view_issue_mitigated_form'); 
    const channelID = 'C02UQ84BXFZ'     // #test-wfb-slack-cli-notifications
    const user = body['user'];
    const userName = body['user']['name'];
    const bodyJson = body;
    const bodychannelJson = body['channel']
    const viewState = view['state'] 
    const resolutionWorkaround = view.state.values['block-id-resolution-selection']['action-id-resolution-selection']['selected_option']['value']; // done
    const resolutionDateVal = view.state.values['block-id-date-resolution']['action-id-date-resolution']['selected_date']; // done
    const resolutionTimeVal = view.state.values['block-id-time-resolution']['action-id-time-resolution']['selected_time']; // done
    const teamFixed = view.state.values['block-id-team-fix-resolution']['action-id-team-fix-resolution']['value']           // done
    const impactDuration = view.state.values['block-id-impa-dura-date-resolution']['action-id-impa-dura-date-resolution']['value'] // done
    const resolutionDetails = view.state.values['block-id-details-resolution']['action-id-details-resolution']['value'] // done
    // const userRequestor = view.state.values['block-id-requestor']['multi_users_select-action_sn_request']['selected_users'][0];
        
    const selectedDate = moment(resolutionDateVal).format('L');
    const selectedTime = moment(resolutionTimeVal).format('HH:mm');
    const DateTimeConCat = `${selectedDate}`+` | `+`${resolutionTimeVal}`;
    // const ImpactDurationFormula; //Go INTO GOOGLE SHEET TO RETRIEVE THE ISSUE CREATION DATE COLUMN, REMOVE THIS DATE FROM THE RESOLUTION DATE AND TIME(MINUS)

    let thread_msg = '';

    if (viewState) {
        thread_msg = 
        `Issue mitigated submission from <@${userName}>\n
         *Date & Time of resolution (DD/MM/YY):* ${DateTimeConCat}\n
         *Resolution or Workaround?* ${resolutionWorkaround}\n
         *Which team fixed the issue?* ${teamFixed}\n
         *Impact duration - From start of issue raised to when confirmed fixed (HH:MM in UTC))* ${impactDuration}\n
         *Details of resolution:* ${resolutionDetails}\n
        `
          // console.log('722 Your submission was successful');
    } else {
        thread_msg = 'There was an error with your submission';
    }

    try {
        const result = await client.chat.postMessage({
            // channel: user, // if we wanted to message the user directly
            channel: channelID,
            text: thread_msg,
            token: process.env.SLACK_BOT_TOKEN,
            // thread_ts: ts, // pull in time stamp from google sheet
        });

        const ts = result.ts;
        const id = result.channel;
        const texts = result.message.text;

        // replyMessage(id,ts,texts)

    }
    catch (error) {
        logger.error(error);
    } 

});

// module.exports.handler = async (event, context, callback) => { 
//     console.log('Received a new Message Event!!');
//     console.log('⚡️ Bolt app started');
//     return handler(event, context, callback);
// }

module.exports.handler = async (event, context, callback) => {
    console.log('⚡️ Bolt app started');

    const handler = await awsLambdaReceiver.start();
    return handler(event, context, callback);
}
