/**
 * @typedef {{id:string,x:number,y:number,type:'anchor'|'joint'|'road'|'optional'}} BridgeNode
 * @typedef {{id:string,fromNodeId:string,toNodeId:string,type:'road'|'support',length:number,cost:number,isPlayerBuilt:boolean}} BridgeEdge
 * @typedef {{id:string,nodes:BridgeNode[],fixedEdges:BridgeEdge[],roadNodeIds:string[],startNodeId:string,finishNodeId:string,budget:number,parBudget:number,costPerUnit:number,stabilityThreshold:number,threeStarStability:number,supportPolicy:'connected'|'braced',buildRules:object,stabilityConfig:object,scoreConfig:object,vehicle:object}} BridgeLevel
 * @typedef {{gameId:'bridge-master',sessionId:string,levelId:string,classLevel:number,status:'completed'|'failed',score:number,stars:0|1|2|3,materialUsed:number,durationSeconds:number,attempts:number,stabilityScore:number,completedAt:string}} GameResult
 */
export {};
