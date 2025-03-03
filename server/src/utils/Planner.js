//Planner imports

//Planner exports

//GRBL dependant variables (All outputs will be in absolute positioning - or # of steps from work Origin. With bounds being stock Origin)

//Console dependant functions/returns for offload to ESP32 hardware.

//File dependant functions/returns for offload to ESP32 and Visual Feedback on client side.

//ESTOP dependant functions/returns for offload to ESP32 hardware. (I.E when someone wishes to stop an action. The robots work area is massive and remote kill of que may be necessary.)
//Although the planner needs to know where the EStop occured in space so that a recovery can be attempted - as large work perices can be expensive to replace.