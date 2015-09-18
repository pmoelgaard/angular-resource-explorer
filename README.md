### WARNING: This document is still in progress !

<br/>

-----

# Angular Resource Explorer (ARM) (INCOMPLETE)

##### Automated fully-functional grid and forms generation from any ARM enabled REST endpoint

<br/>

-----

## ARM Enabling the REST endpoint

1) Adding a "specification" document section to the endpoint

##### Sample


	{
	  idField: 'cmdUID',
      properties: [
        {name: 'description', type: 'string', required: true},
        {name: 'alarmSeverity', type: 'string', required: true},
        {name: 'numberDemo', type: 'number', required: true, min=[number], max=[number] }
      ]
    }
    
### Supported Data Types
 
 - string
 - float
 - enum
 - relation
