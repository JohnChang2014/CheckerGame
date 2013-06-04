/* ******************  Artificial Intelligence CS 6613 Spring 12 *******************
 * Final Project for Checker Game
 * Programmer: Ching-Che Chang
 * Email: johnsonchang@nyu.edu
 * Introduction:
 * This checker game is implemented by Alpha-Beta search algorithm.
 **********************************************************************************/

/* An object in charge of initiating all parameters required by checker game
 * parameters:
 *    param: a JSON object that user can customize his own parameters
 *
 * return values:
 *    data: a JSON object includes all parameters required by checker game
 */
function parameter(param){
    if (param.width) var width = param.width;
    else var width = 8;
    
    var data = {
        'tiles': {
            'whole': [1, -1, 1, -1, 1, -1, 1, -1, -1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, 1, -1, 1, -1, -1, 0, -1, 0, -1, 0, -1, 0, 0, -1, 0, -1, 0, -1, 0, -1, -1, 2, -1, 2, -1, 2, -1, 2, 2, -1, 2, -1, 2, -1, 2, -1, -1, 2, -1, 2, -1, 2, -1, 2],
            'max': null,
            'min': null
        },
        'width': width,
        'max_offset': {
            'moveL': width - 1,
            'moveR': width + 1,
            'jumpL': (width * 2) - 2,
            'jumpR': (width * 2) + 2
        },
        'min_offset': {
            'moveL': (width + 1) * -1,
            'moveR': (width - 1) * -1,
            'jumpL': ((width * 2) + 2) * -1,
            'jumpR': ((width * 2) - 2) * -1
        },
        'max_index': (width * width) - 1,
        'move_weight': [6, 5, 4, 3, 2, 1],
        'default_cutoff': 0
    };
    
    // combine two JSON objects into the fist one
    $.extend(data, param);
    data.tiles = initTilesMatrix(data.tiles);
    
    return data;
    
    function initTilesMatrix(tiles){
        var max = new Array();
        var min = new Array();
        for (index in tiles.whole) {
            if (tiles.whole[index] == -1 || tiles.whole[index] == 0) continue;
            if (tiles.whole[index] == 1) max.push(index);
            if (tiles.whole[index] == 2) min.push(index);
        }
        tiles.max = max;
        tiles.min = min;
        return tiles;
    };
    };

/* An object in charge of performing Alpha-Beta search algorithm
 * 
 */
function outputer(){
    var my = this;
    
    my.outputStatistics = function(data){
        var note = '';
        note += "======= Statistic =======\n";
        //my.output("===== Statistic =====");
        for (var tag in data) 
            note += tag + ": " + data[tag] + "\n";
        //my.output(tag + ": " + data[tag]);
        //my.output("=====================");
        note += "=====================\n\n";
        my.output(note);
    };
    
    my.output = function(note){
        var data = note + $("div.output textarea").text();
        $("div.output textarea").empty().append(data + "\n");
    };
    
    my.outputTilesMatrix = function(player, depth, tiles, a, b){
        my.output(player + "-player, Current depth:" + depth);
        my.output("a: " + a + ", b: " + b);
        my.output("=================");
        //my.output("size: " + tiles.length);
        var note = '';
        for (var index in tiles.whole) {
            if (tiles.whole[index] != -1) note += tiles.whole[index] + ", ";
            else note += "~, ";
            if ((parseInt(index) % 8) == 7) note += "\n";
        }
        my.output(note + "\n");
    };
    
    my.outputAllMoves = function(player, actions){
        var n = 0;
        for (path in actions) 
            n++;
        my.output(player + "-player has " + n + " choices:");
        for (path in actions) 
            my.output(path + ", type:" + actions[path]);
    };
};

/* An object in charge of outputing the information after the algorithm performs
 * 
 */
function utility(gc){
    var my = this;
    //my.tiles = gc.tiles;
    my.max_offset = gc.param.max_offset;
    my.min_offset = gc.param.min_offset;
    my.max_index = gc.param.max_index;
    my.outputer = gc.outputer;
    
    my.findAllMovesOfTile = function(player, tiles, index){
        var paths = my.findActionsPool(player, tiles);
        var tmp = new Array();
        var path;
        for (path in paths) {
            var node = path.split('-');
            if (node[0] == index) tmp[path] = paths[path];
        }
        //for (path in tmp) my.outputer.output("tile's moves =>type:" + tmp[path] + ", " + path);
        return tmp;
    };
    
    my.findActionsPool = function(player, tiles){
        var actions = new Array();
        var isJumpExist = false;
        if (player == 1) var target = tiles.max;
        if (player == 2) var target = tiles.min;
        //my.outputer.outputTilesMatrix(player, 0, tiles, 0,0);
        //alert(tiles.whole);
        for (index in target) {
            var tile_index = parseInt(target[index]);
            var check_path = decidePath(player, tiles, tile_index, false);
            if (check_path.result == "Jump") isJumpExist = true;
            for (action in check_path.actions) 
                actions[action] = check_path.actions[action];
        }
        
        // if there is a jump in the pool, remove all regular moves in the pool 
        if (isJumpExist) {
            var jump_actions = new Array();
            for (action in actions) {
                //alert("type=" + actions[action] + ", action="+ action);
                if (actions[action] >= 0 && actions[action] < 3) {
                    //alert("type=" + actions[action] + ", action="+ action);
                    jump_actions[action] = actions[action];
                }
            }
            actions = jump_actions;
        }
        
        //my.outputer.output("\nactions pool=========");
        //for (action in actions) my.outputer.output("type:" + actions[action] + "->" + action);
        return actions;
        
        function decidePath(player, tiles, index, isJumpOnly, actions, previous_path, last_type){
            if (arguments.length <= 5) {
                var previous_path = '';
                var actions = new Array();
            }
            var result = 'None';
            var start = index;
            var action = previous_path + "-" + start;
            var next_L = my.nexts(player, start, "L");
            var next_R = my.nexts(player, start, "R");
            var isKeypoint = 0;
            for (var n = 1; n <= 2; n++) {
                if (n == 1) {
                    var direction = "L";
                    var next = next_L;
                } else if (n == 2) {
                    var direction = "R";
                    var next = next_R;
                }
                var type = my.move_type(player, tiles, next);
                
                if (!isJumpOnly && type >= 3) { // is Move
                    var move = action.substring(1) + "-" + next.one;
                    actions[move] = type;
                } else { // is Jump
                    if (type >= 0 && type < 3) {
                        decidePath(player, tiles, next.two, true, actions, action, type);
                        isKeypoint++;
                    }
                }
            }
            
            if (isJumpOnly && isKeypoint == 0) {
                action = action.substring(1);
                actions[action] = last_type;
            }
            if (isKeypoint > 0) result = 'Jump';
            return {
                'result': result,
                'actions': actions
            };
        };
            };
    
    /*
     //my.findAllPaths = function(depth, player, tiles, previous, index, path, isMove_type){
     my.findAllPaths = function(player, tiles, previous, index, path, isMove_type){
     //alert("next_index==> "+index);
     if (!isValidIndex(index)) return "";
     
     var direction = getMoveDirections(tiles, index, isMove_type);
     var note = "";
     var isKeypoint = 0;
     
     for (type in direction) {
     note += ", " + type + " => " + direction[type];
     if (player == 1) var next_index = parseInt(index) + parseInt(my.offset[type]);
     if (player == 2) var next_index = parseInt(index) + (parseInt(my.offset[type]) * -1);
     
     // consider the action "move"
     if ((type == 'moveL' || type == 'moveR') && direction[type]) path += "-" + index + "-" + next_index + ",";
     
     // consider the action "jump"
     if ((type == 'jumpL' || type == 'jumpR') && direction[type]) {
     isKeypoint++;
     simulateTilesMove(tiles, index, next_index);
     //alert("consider next_tile==> "+next_index);
     var tmp_path = my.findAllPaths((depth + 1), player, tiles, index, next_index, "", true);
     path += "-" + index + tmp_path;
     if (isKeypoint == 2) path = path.replace(/\,/g, (",-" + previous));
     //alert("tmp_path=> "+path);
     //alert("resume tiles");
     //alert(next_index +"====>"+index);
     simulateTilesMove(tiles, next_index, index);
     }
     }
     //alert(note);
     if (isMove_type && path == "") path += "-" + index + ",";
     //alert("return path => " + path);
     return path;
     
     function getMoveDirections(tiles, index, isMove_type){
     //var offset    = 0;
     var move_type = "move";
     var result = {
     'moveL': false,
     'moveR': false,
     'jumpL': false,
     'jumpR': false
     };
     for (type in result) {
     if (isMove_type && ((type == 'moveL' || type == 'moveR'))) continue;
     if (type == 'moveL' || type == 'moveR') move_type = "move";
     if (type == 'jumpL' || type == 'jumpR') move_type = "jump";
     //alert(type +" === "+ offset[type]);
     result[type] = checkMoveAvailable(tiles, index, my.offset[type], move_type);
     }
     // if there is a tile with actions of move and jump, we only consider jump
     if (result.jumpL || result.jumpR) {
     result.moveL = false;
     result.moveR = false;
     }
     
     return result;
     
     function checkMoveAvailable(tiles, index, offset, move_type){
     if (tiles[index] == 2) offset = parseInt(offset) * -1;
     var check_index = parseInt(index) + offset;
     // empty squares means your tiles can move
     //alert("check ==>" + index +" ==> "+ check_index);
     if (move_type == "move" && isValidIndex(check_index) && (tiles[check_index] == 0)) return true;
     // opponent's tiles in front of your tiles means your tiles can jump
     var middle_index = parseInt(index) + (offset / 2);
     //alert(offset + " check ==>" + tiles[middle_index] +" <==> "+ tiles[index]);
     if (move_type == "jump" && isValidIndex(check_index) && ((((tiles[middle_index] != 0) && (tiles[middle_index] != tiles[index])) && tiles[check_index] == 0))) return true;
     return false;
     };
     };
     
     function isValidIndex(index){
     if (index > my.dimension) return false;
     return true;
     };
     
     function simulateTilesMove(tiles, index, next_index){
     var player = tiles[index];
     tiles[index] = 0;
     tiles[next_index] = player;
     
     };
     };
     */
    my.move_type = function(player, tiles, next){
        if (player == 1) {
            if (next.two > my.max_index && tiles.whole[next.one] == 0) return 3; // perfect move 
            if (tiles.whole[next.two] != 2 && tiles.whole[next.one] == 0) return 4; // safe move
            if (tiles.whole[next.two] == 2 && tiles.whole[next.one] == 0) return 5; // dangerous move
            if (next.three > my.max_index && tiles.whole[next.two] == 0 && tiles.whole[next.one] == 2) return 0; // perfect jump
            if (tiles.whole[next.three] != 2 && tiles.whole[next.two] == 0 && tiles.whole[next.one] == 2) return 1; // safe jump
            if (tiles.whole[next.three] == 2 && tiles.whole[next.two] == 0 && tiles.whole[next.one] == 2) return 2; // dangerous jump
        } else if (player == 2) {
            if (next.two < 0 && tiles.whole[next.one] == 0) return 3; // perfect move
            if (tiles.whole[next.two] != 1 && tiles.whole[next.one] == 0) return 4; // safe move
            if (tiles.whole[next.two] == 1 && tiles.whole[next.one] == 0) return 5; // dangerous move
            if (next.three < 0 && tiles.whole[next.two] == 0 && tiles.whole[next.one] == 1) return 0; // perfect jump 
            if (tiles.whole[next.three] != 1 && tiles.whole[next.two] == 0 && tiles.whole[next.one] == 1) return 1; // safe jump
            if (tiles.whole[next.three] == 1 && tiles.whole[next.two] == 0 && tiles.whole[next.one] == 1) return 2; // dangerous jump
        }
        return -1;
    };
    
    my.nexts = function(player, start_index, direction){
        var one, two, three;
        if (player == 1) var offset = my.max_offset;
        if (player == 2) var offset = my.min_offset;
        if (direction == 'L') var diff = parseInt(offset.moveL);
        if (direction == 'R') var diff = parseInt(offset.moveR);
        
        one = parseInt(start_index) + diff;
        two = one + diff;
        three = two + diff;
        //my.outputer.output(start_index+"===>" + one + "->" + two + "->" + three);
        return {
            'one': one,
            'two': two,
            'three': three
        };
    };
    
    my.cloneMatrixdata = function(tiles){
        return {
            'whole': tiles.whole.slice(0),
            'max': tiles.max.slice(0),
            'min': tiles.min.slice(0)
        };
    };
    
    my.isJump = function(player, index, next_index, type){
        var isJump = false;
        var move_type = "move";
        //alert("player:" + player + ", type=" + type + "===>" + index + "-" + next_index);
        if (type >= 0 && type < 3) { // is a jump
            if (player == 1) var offset = my.max_offset;
            if (player == 2) var offset = my.min_offset;
            var difference = next_index - index;
            var jumpL = offset.jumpL;
            var jumpR = offset.jumpR;
            if (player == 1 && jumpL == difference) move_type = "jumpL";
            if (player == 1 && jumpR == difference) move_type = "jumpR";
            if (player == 2 && jumpL == difference) move_type = "jumpR";
            if (player == 2 && jumpR == difference) move_type = "jumpL";
            isJump = true;
        }
        return {
            'isJump': isJump,
            'move_type': move_type
        };
    };
    
    my.switchTiles = function(tiles, index, next_index){
        var player = tiles.whole[index];
        tiles.whole[index] = 0;
        tiles.whole[next_index] = player;
        index = "" + index;
        if (player == 1) {
            var ori_index = tiles.max.indexOf(index);
            //alert("max player:"+ori_index);
            tiles.max[ori_index] = next_index;
        }
        if (player == 2) {
            var ori_index = tiles.min.indexOf(index);
            tiles.min[ori_index] = next_index;
        }
    };
    
    my.removeTiles = function(tiles, player, index){
        tiles.whole[index] = 0;
        var index = "" + index;
        if (player == 1) {
            var delete_index = tiles.min.indexOf(index);
            tiles.min.splice(delete_index, 1);
        }
        if (player == 2) {
            var delete_index = tiles.max.indexOf(index);
            tiles.max.splice(delete_index, 1);
        }
        //my.outputer.output("kill_"+ index);
        //my.outputer.output("max_alive: " + tiles.max.length +", min_alive: " + tiles.min.length + "\n");
    };
};

/* An object in charge of performing Alpha-Beta search algorithm
 * 
 */
function algorithm(gc){
    var my = this;
    my.outputer = gc.outputer;
    my.width = gc.param.width;
    my.default_cutoff = gc.param.default_cutoff;
    my.dimension = my.width * my.width;
    my.max_offset = gc.param.max_offset;
    my.min_offset = gc.param.min_offset;
    my.max_index = gc.param.max_index;
    my.move_weight = gc.param.move_weight;
    my.utility = gc.utility;
    my.role = 1;
    
    my.statics = {
        'max_depth': 0,
        'num_nodes': 0,
        'num_of_max_pruning': 0,
        'num_of_min_pruning': 0
    };
    
	/* The method runAlphaBetaSearch
 	* return values:
 	*    data: a JSON object includes the move the program will choose
 	*/
    my.runAlphaBetaSearch = function(role, tiles, level){
        my.role = role;
        my.level = level;
		// decide cutoff according to the level user chose
        if (my.level == 1) var cutoff = 1 + my.default_cutoff;
        if (my.level == 2) var cutoff = 2 + my.default_cutoff;
        if (my.level >= 3) var cutoff = 3 + my.default_cutoff;
        if (my.role == 1) {
            var result = my.runMaxValue(1, tiles, -9999, 9999, cutoff);
        } else if (my.role == 2) {
            var result = my.runMinValue(1, tiles, -9999, 9999, cutoff);
        }
		my.outputer.outputStatistics(my.statics);
        my.outputer.output("Johnson moves: " + result.chosen_action + "\n");
        return result;
    };
    
    my.runMaxValue = function(depth, tiles, a, b, cutoff){
        var tiles = my.utility.cloneMatrixdata(tiles);
        if (depth > my.statics.max_depth) my.statics.max_depth = depth;
        
        var check_state = my.terminalTest(1, tiles, depth, cutoff);
        if (check_state.isTerminal) return check_state; //check??
        var actions = check_state.state_data.moves.max_actions;
        var skip = check_state.state_data.moves.max_actions_num;
        var check_v = {
            'eval_value': -9999,
            'chosen_action': 'none',
            'chosen_type': -1,
            'actions': actions,
            'action_candidate': new Array()
        };

        for (var path in actions) {
            my.statics.num_nodes++;
            var type = parseInt(actions[path]);
            if (skip > 1) {
                var next_result = my.runMinValue(depth + 1, my.getResultState(tiles, path, type), a, b, cutoff);
                check_v = v_max(check_v, next_result.eval_value, path, type);
            } else {
                check_v = v_max(check_v, 2, path, type);
            }
            if (check_v.eval_value >= b) {
                my.statics.num_of_max_pruning++;
                $.extend(check_state, check_v);
                return check_state;
            }
            a = max(a, check_v.eval_value);
        }
        
        $.extend(check_state, check_v);
        return check_state;
        
        function max(j, k){
            if (j > k) return j;
            else return k;
        };
        
        function v_max(check_v, eval_value, action, type){
            check_v.action_candidate[action] = eval_value;
            if (eval_value < check_v.eval_value) return check_v;
            my.changeValue(check_v, eval_value, action, type);
            return check_v;
        };
    };
    
    my.runMinValue = function(depth, tiles, a, b, cutoff){
        var tiles = my.utility.cloneMatrixdata(tiles);
        if (depth > my.statics.max_depth) my.statics.max_depth = depth;
        
        var check_state = my.terminalTest(2, tiles, depth, cutoff);
        if (check_state.isTerminal) return check_state;
        
        var actions = check_state.state_data.moves.min_actions;
        var skip = check_state.state_data.moves.min_actions_num;
        var check_v = {
            'eval_value': 9999,
            'chosen_action': 'none',
            'chosen_type': -1,
            'actions': actions,
            'action_candidate': new Array()
        };

        for (var path in actions) {
            my.statics.num_nodes++;
            var type = parseInt(actions[path]);

            if (skip > 1) {
                var next_result = my.runMaxValue(depth + 1, my.getResultState(tiles, path, type), a, b, cutoff);
                check_v = v_min(check_v, next_result.eval_value, path, type);
            } else {
                check_v = v_min(check_v, -2, path, type);
            }
            if (check_v.eval_value <= a) {
                my.statics.num_of_min_pruning++;
                $.extend(check_state, check_v);
                return check_state;
            }
            
            b = min(b, check_v.eval_value);
        }
        
        $.extend(check_state, check_v);
        return check_state;
        
        function min(j, k){
            if (j < k) return j;
            else return k;
        };
        
        function v_min(check_v, eval_value, action, type){
            check_v.action_candidate[action] = eval_value;
            if (eval_value > check_v.eval_value) return check_v;
            my.changeValue(check_v, eval_value, action, type);
            return check_v;
        };
    };
    
    my.changeValue = function(check_v, eval_value, action, type){
        if (check_v.chosen_action != 'none') {
            if (type > check_v.chosen_type) return check_v;
            if (my.level != 4 && Math.round(Math.random())) return check_v;
        }
        check_v.eval_value = eval_value;
        check_v.chosen_action = action;
        check_v.chosen_type = type;
        return check_v;
    };
    
	/* decide if the node is a terminal one or not
     * parameters:
     *    tiles: array
     *
     * return values:
     *    isTerminal: true or false
     *    num_tiles: a result set of the number of tiles in either side
     *    moves: a result set of all possible moves of every tiles in either side
     */
    my.isTerminalNode = function(tiles){
        var isTerminal = false;
        var check_tiles = isNoTilesAlive(tiles);
        
        var check_moves = isNoTilesAvailableToMove(tiles);
        
        if (check_tiles.isNoTilesAlive || check_moves.isNoMoveAvailable) isTerminal = true;
        
        return {
            'isTerminal': isTerminal,
            'num_tiles': check_tiles,
            'moves': check_moves
        };
        
        // decide if there is no tiles alive in either of players
        function isNoTilesAlive(tiles){
            var isNoTilesAlive = false;
            var max_tiles = parseInt(tiles.max.length);
            var min_tiles = parseInt(tiles.min.length);
            if (max_tiles == 0 || min_tiles == 0) isNoTilesAlive = true;
            return {
                'isNoTilesAlive': isNoTilesAlive,
                'max_tiles': max_tiles,
                'min_tiles': min_tiles
            };
        };
        
        // decide if there is no possible move available in both of players
        function isNoTilesAvailableToMove(tiles){
            var isNoMoveAvailable = false;
            
            var max_actions = my.utility.findActionsPool(1, tiles);
            var min_actions = my.utility.findActionsPool(2, tiles);
            var max_actions_num = 0;
            var min_actions_num = 0;
            for (action in max_actions) max_actions_num++;
            for (action in min_actions) min_actions_num++;
			
            if (max_actions_num == 0 || min_actions_num == 0) isNoMoveAvailable = true;
            return {
                'isMoveAvailable': isNoMoveAvailable,
                'max_actions': max_actions,
                'min_actions': min_actions,
                'max_actions_num': max_actions_num,
                'min_actions_num': min_actions_num
            };
        };
    };
    
    /* decide if a terminal state shows up or not
     * parameters:
     *    tiles: array
     *    depth: int
     *    cutoff: int (-1 means we don't consider the case of cutoff)
     *
     * return values:
     *    isTerminal: true or false
     *    eval_value: a value to decide which move can be taken or who is the winner in this game
     *    state_data: a result set of all possible moves of every tiles and the number of tiles alive in either side
     */
    my.terminalTest = function(player, tiles, depth, cutoff){
        var check_node = my.isTerminalNode(tiles);
        var eval_value = 0;
        
        if (cutoff == -1 && check_node.isTerminal) eval_value = my.decideWinner(check_node);
        else if (depth == cutoff) {
            check_node.isTerminal = true;
            eval_value = my.evaluateState(player, check_node);
            if (player == 1) var actions = check_node.moves.max_actions;
            if (player == 2) var actions = check_node.moves.min_actions;
        }
        var type = 6;
        var chosen_action = "none";
        for (var action in actions) {
            var check_type = parseInt(actions[action]);
            if (check_type < type) {
                var chosen_action = action;
                var chosen_type = check_type;
                type = check_type;
            }
        }
        
        return {
            'isTerminal': check_node.isTerminal,
            'eval_value': eval_value,
            'state_data': check_node,
            'chosen_action': chosen_action,
            'chosen_type': chosen_type,
            'actions': actions,
            'action_candidate': null
        };
    };
    
    /* decide if a terminal state shows up or not
     * parameters:
     *    state_data: a JSON Object include the result of computing the number of tiles on both sides
     *
     * return values:
     *    state_value: 1: max player win, -1: min player win, and 0: draw
     */
    my.decideWinner = function(state_data){
        var max_tiles = state_data.num_tiles.max_tiles;
        var min_tiles = state_data.num_tiles.min_tiles;
        if (max_tiles == 0) return -1;
        if (min_tiles == 0) return 1;
        return 0;
    };
    
	/* decide if an evaluation value for a non-terminal node
     *
     */
    my.evaluateState = function(player, state_data){
        var max_tiles = state_data.num_tiles.max_tiles;
        var min_tiles = state_data.num_tiles.min_tiles;
        var max_actions = state_data.moves.max_actions;
        var min_actions = state_data.moves.min_actions;
        var max_v = 0;
        var min_v = 0;
        var tmp, difference;
        if (player == 1) {
            max_v = max_tiles;
            min_v = min_tiles - getEvalScore(max_actions);
        }
        if (player == 2) {
            max_v = max_tiles - getEvalScore(min_actions);
            min_v = min_tiles;
        }
        return max_v - min_v;
        
        function getEvalScore(actions){
            var attack = 0;
            var s_attack = 0;
            for (var path in actions) {
                var type = parseInt(actions[path]);
                var tmp = path.split("-");
                if (type == 4) continue; // ignore safe move, since it won't affect the number of tiles of both sides
                if (type == 0) s_attack = 2 + (tmp.length - 2);
                if (type == 1) s_attack = 1 + (tmp.length - 2);
                if (type == 2) s_attack = 0 + (tmp.length - 2);
                if (type == 3) s_attack = 2;
                if (type == 5) s_attack = -1;
                if (s_attack > attack) attack = s_attack;
            };
            if (attack >= 0) return attack;
            else return -1;
        };
    };
    
    my.getResultState = function(tiles, action, type){
        var tiles = my.utility.cloneMatrixdata(tiles);
        var tmp = action.split("-");
        
        for (node in tmp) {
            var index = parseInt(tmp[node]);
            var next_index = parseInt(tmp[parseInt(node) + 1]);
            if (tiles.whole[index] == -1 || tiles.whole[index] == 0) continue;
            simulateTilesMove(tiles, index, next_index, type);
            if (node == (tmp.length - 2)) break;
        }
        
        return tiles;
        
        function simulateTilesMove(tiles, index, next_index, type){
            var player = tiles.whole[index];
            my.utility.switchTiles(tiles, index, next_index);
            var check_move = my.utility.isJump(player, index, next_index, type);
            if (check_move.isJump) {
                if (player == 1) {
                    if (check_move.move_type == "jumpL") var middle_index = index + my.width - 1;
                    if (check_move.move_type == "jumpR") var middle_index = index + my.width + 1;
                }
                if (player == 2) {
                    if (check_move.move_type == "jumpL") var middle_index = index - my.width + 1;
                    if (check_move.move_type == "jumpR") var middle_index = index - my.width - 1;
                }
                my.utility.removeTiles(tiles, player, middle_index);
            }
        };
            };
};

/* An object in charge of controlling the behaviors of a checkerboard
 * 
 */
function checkerboard(gc){
    var my = this;
    my.gc = gc;
    my.algorithm = my.gc.algorithm;
    my.outputer = gc.outputer;
    my.utility = gc.utility;
    my.user = 1;
    
    my.initialParameter = function(param){
        my.param = param;
        my.width = my.param.width;
        my.dimension = my.width * my.width;
        my.max_offset = param.max_offset;
        my.min_offset = param.min_offset;
        
        if (my.param.tiles == null) {
            my.tiles = [1, -1, 1, -1, 1, -1, 1, -1, -1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, 1, -1, 1, -1, -1, 0, -1, 0, -1, 0, -1, 0, 0, -1, 0, -1, 0, -1, 0, -1, -1, 2, -1, 2, -1, 2, -1, 2, 2, -1, 2, -1, 2, -1, 2, -1, -1, 2, -1, 2, -1, 2, -1, 2];
        } else {
            my.tiles = my.param.tiles;
        }
    };
    
    my.stylizeBoard = function(){
        $("table.board tr:even").each(function(){
            $(this).find('td:odd').removeClass().addClass("td_even");
            $(this).find('td:even').removeClass().addClass("td_odd");
        });
        $("table.board tr:odd").each(function(){
            $(this).find('td:even').removeClass().addClass("td_even");
            $(this).find('td:odd').removeClass().addClass("td_odd");
        });
        $("table.board td[path*='-']").each(function(){
            $(this).empty();
            $(this).attr('path', '');
        });
        $("table.board td").droppable("destroy");
    };
    
    my.setDraggable = function(player){
        $("div.img_frame[tile_type='" + player + "']").draggable({
            'appendTo': "body",
            'helper': "clone",
            'start': function(){
                var index = $(this).attr('tile_index');
                var paths = my.utility.findAllMovesOfTile(player, my.gc.tiles, index);
                my.drawMovingPath($(this).attr('id'), paths);
            },
            'drag': function(){
            
            },
            'stop': function(){
                my.stylizeBoard();
            }
        });
    };
    
    my.setDroppable = function(target, index){
        $("table.board td:eq(" + index + ")").droppable({
            accept: "#" + target,
            drop: function(event, ui){
                var type = parseInt($("table.board td:eq(" + index + ")").attr('type'));
                var path = $("table.board td:eq(" + index + ")").attr('path');
                var source_index = ui.draggable.attr('tile_index');
                ui.draggable.attr('tile_index', index);
                $("table.board td:eq(" + index + ")").attr('path', '');
                $("table.board td:eq(" + index + ")").empty();
                $(this).append(ui.draggable);
                my.updateTilesMatrix(path, type);
                if (!my.gc.computeScore()) {
                    //alert("after score: \n\n" + my.tiles.whole + "\n\n");
                    setTimeout(function(){
                        if (my.user == 1) my.gc.moveTileAutomatically(2, my.tiles, my.gc.setting_data.game_level);
                        if (my.user == 2) my.gc.moveTileAutomatically(1, my.tiles, my.gc.setting_data.game_level);
                    }, 1500);
                }
                return false;
            }
        });
    };
    
    my.updateTilesMatrix = function(path, type){
        var tmp = path.split('-');
        var end = tmp.length - 1;
        var n = 0;
        
        for (n in tmp) {
            n = parseInt(n);
            var check = my.utility.isJump(my.user, tmp[n], tmp[n + 1], type);
            my.utility.switchTiles(my.tiles, tmp[n], tmp[n + 1]);
            if (type < 3) removeTilesInPath(check, parseInt(tmp[n]));
            if (n == (end - 1)) break;
        }
        
        function removeTilesInPath(check, index){
            if (!check.isJump) return false;
            if (my.user == 1 && check.move_type == "jumpL") var middle_index = index + my.width - 1;
            if (my.user == 1 && check.move_type == "jumpR") var middle_index = index + my.width + 1;
            if (my.user == 2 && check.move_type == "jumpL") var middle_index = index - my.width + 1;
            if (my.user == 2 && check.move_type == "jumpR") var middle_index = index - my.width - 1;
            //alert("remove tile_" + middle_index + " of player_" + my.user);
            $("table.board td:eq(" + middle_index + ")").empty();
            
            my.utility.removeTiles(my.tiles, my.user, middle_index);
        };
            };
    
    my.assignTileImage = function(player, index){
        $frame = $("<div></div>");
        $frame.addClass("img_frame");
        $frame.attr("id", player + "-" + index);
        $frame.attr("tile_index", index);
        $frame.attr("tile_type", player);
        $img = $("<img></img>");
        if (player == 1) $img.attr('src', './img/max.png');
        if (player == 2) $img.attr('src', './img/min.png');
        $frame.append($img);
        $("table.board td:eq(" + index + ")").empty().append($frame);
    };
    
    my.drawMovingPath = function(target, paths){
        var index = 0;
        var n, path;
        for (path in paths) {
            //my.outputer.output("draw moving:" + path);
            var tmp = path.split('-');
            var end = tmp.length - 1;
            for (n in tmp) {
                $("table.board td:eq(" + tmp[n] + ")").removeClass().addClass("td_path");
            }
            $("table.board td:eq(" + tmp[end] + ")").attr('type', paths[path]);
            $("table.board td:eq(" + tmp[end] + ")").attr('path', path);
            $("table.board td:eq(" + tmp[end] + ")").text('P' + (parseInt(index) + 1));
            my.setDroppable(target, tmp[end]);
            index++;
        }
    };
    
    my.moveTile = function(player, tiles, result){
        var action = result.chosen_action;
        var type = result.actions[action];
        var tmp = action.split("-");
        for (node in tmp) {
            var index = tmp[node];
            var next_index = tmp[parseInt(node) + 1];
            if (tiles.whole[index] == -1 || tiles.whole[index] == 0) continue;
            doTilesMove(tiles, index, next_index, type);
            if (node == (tmp.length - 2)) break;
        }
        return tiles;
        
        function doTilesMove(tiles, index, next_index, type){
            var player = tiles.whole[index];
            my.utility.switchTiles(tiles, index, next_index);
            var img = $("table.board td:eq(" + index + ") div.img_frame").clone();
            img.attr("tile_index", next_index);
            $("table.board td:eq(" + next_index + ")").empty().append(img);
            $("table.board td:eq(" + index + ")").empty();
            index = parseInt(index);
            next_index = parseInt(next_index);
            var check_move = my.utility.isJump(player, index, next_index, type);
            if (check_move.isJump) {
                if (player == 1) {
                    if (check_move.move_type == "jumpL") var middle_index = index + my.width - 1;
                    if (check_move.move_type == "jumpR") var middle_index = index + my.width + 1;
                }
                if (player == 2) {
                    if (check_move.move_type == "jumpL") var middle_index = index - my.width + 1;
                    if (check_move.move_type == "jumpR") var middle_index = index - my.width - 1;
                }
                $("table.board td:eq(" + middle_index + ")").empty();
                my.utility.removeTiles(tiles, player, middle_index);
            }
        };
    };
    
    my.setUser = function(user){
        if (user == 1) my.user = 1;
        else my.user = 2;
        my.setDraggable(my.user);
        return false;
    };
    
    my.fillWithBlankImage = function(index){
        var $frame = $("<div></div>");
        $frame.addClass("blank_frame");
        $("table.board td:eq(" + index + ")").empty().append($frame);
    };
    
    my.setTilesArray = function(){
        var index;
        for (index in my.tiles.whole) {
            if (my.tiles.whole[index] == 0) continue;
            if (my.tiles.whole[index] == -1) my.fillWithBlankImage(index);
            else my.assignTileImage(my.tiles.whole[index], index);
        }
    };
    
    my.initial = function(param){
        my.initialParameter(param);
        my.setTilesArray();
        my.stylizeBoard();
    };
};

/* An object in charge of controlling the flow of the program
 * 
 */
function gamecontroller(param){
    var my = this;
    my.param = param;
    my.tiles = my.param.tiles;
    my.setting_data = {};
    my.outputer = new outputer();
    my.utility = new utility(this);
    my.algorithm = new algorithm(this);
    my.checkerboard = new checkerboard(this);
    
    my.setButtonListener = function(){
        $('#start_button').bind('click', function(){
            var nickname = $.trim($("#setting_table #nickname").val());
            var move_order = parseInt($.trim($("#setting_table input[name='move_order']:checked").val()));
            var level = $.trim($("#setting_table #game_level").val());
            $.extend(my.setting_data, {
                'nickname': nickname,
                'move_order': move_order,
                'game_level': level
            });
            $('#isPress').val(1);
            $("div.bg").tabs("option", "selected", 1);
            my.checkerboard.setUser(move_order);
            my.initRecordBoard();
            $('table.board').unblock();
            return false;
        });
        
        $('#forfeit').bind('click', function(){
            if (my.isForfeit()) {
                var user = my.setting_data.move_order;
                if (user == 1) my.moveTileAutomatically(2, my.tiles, my.setting_data.game_level);
                if (user == 0) my.moveTileAutomatically(1, my.tiles, my.setting_data.game_level);
            } else {
                alert("You are not allowed to forfeit now!");
            }
            return false;
        });
        
        $('#new_game').bind('click', function(){
            location.reload(true);
            return false;
        });
        
        $('#surrender').bind('click', function(){
            var nickname = my.setting_data.nickname;
            $('table.board').block({
                message: '<h2>You are loser, ' + nickname + '!</h2>',
                css: {
                    color: '#ff0000',
                    width: '330px',
                    border: '5px solid #c0c0c0'
                }
            });
            return false;
        });
    };
    
    my.computeScore = function(){
        var max_tiles = my.tiles.max.length;
        var min_tiles = my.tiles.min.length;
        var max_top_tiles = 0;
        var min_top_tiles = 0;
        var width = parseInt(my.param.width);
        var top_line = width - 1;
        var lowest_line = (width * width) - width;
        var n, index;
        
        for (n in my.tiles.max) {
            index = my.tiles.max[n];
            if (my.tiles.whole[index] == 1 && index > lowest_line) max_top_tiles++;
        }
        for (n in my.tiles.min) {
            index = my.tiles.min[n];
            if (my.tiles.whole[index] == 2 && index < top_line) min_top_tiles++;
        }
        var max_score = (max_tiles - max_top_tiles) + (max_top_tiles * 2);
        var min_score = (min_tiles - min_top_tiles) + (min_top_tiles * 2);
        $("table.record_table td.max_tiles").empty().append(max_tiles);
        $("table.record_table td.min_tiles").empty().append(min_tiles);
        $("table.record_table td.max_score").empty().append(max_score);
        $("table.record_table td.min_score").empty().append(min_score);
        
        if (my.isGameOver(max_top_tiles, min_top_tiles)) {
            var user = my.setting_data.move_order;
            if (max_score > min_score) {
                if (user == 1) showEndingResult(1); // user wins
                if (user == 0) showEndingResult(-1); // user loses
            } else if (max_score < min_score) {
                if (user == 1) showEndingResult(-1); // user loses
                if (user == 0) showEndingResult(1); // user wins
            } else {
                showEndingResult(0); // game draw
            }
            return true;
        }
        return false;
        
        function showEndingResult(index){
            if (index == 1) {
                var nickname = my.setting_data.nickname;
                $('table.board').block({
                    message: '<h2>You are winner, ' + nickname + '!</h2>',
                    css: {
                        color: '#ff0605',
                        width: '330px',
                        border: '5px solid #c0c0c0'
                    }
                });
            }
            if (index == -1) {
                var nickname = my.setting_data.nickname;
                $('table.board').block({
                    message: '<h2>You are loser, ' + nickname + '!</h2>',
                    css: {
                        color: '#ff0000',
                        width: '330px',
                        border: '5px solid #c0c0c0'
                    }
                });
            }
            if (index == 0) {
                $('table.board').block({
                    message: '<h2>Draw.</h2>',
                    css: {
                        color: '#00f000',
                        width: '330px',
                        border: '5px solid #c0c0c0'
                    }
                });
            }
        };
            };
    
    my.initialUI = function(){
        $("div.bg").tabs({
            select: function(event, ui){
                var selected = $(this).tabs("option", "selected");
                if ($('#isPress').val() == 0 && selected == 0) {
                    alert("you hasn't clicked the start button!");
                    return false;
                }
                if ($('#isPress').val() == 1 && selected == 0) {
                    if (my.setting_data.move_order == 0) {
                        setTimeout(function(){
                            my.moveTileAutomatically(1, my.tiles, my.setting_data.game_level);
                        }, 500);
					}
                }
                $('#isPress').val(0);
            }
        });
        
        $("#description").paginate({
            count: 3,
            start: 1,
            display: 5,
            border: true,
            border_color: '#fff',
            text_color: '#fff',
            background_color: 'black',
            border_hover_color: '#ccc',
            text_hover_color: '#000',
            background_hover_color: '#fff',
            images: false,
            mouse: 'press',
            onChange: function(page){
                $('._current', '#paginationdemo').removeClass('_current').hide();
                $('#p' + page).addClass('_current').show();
            }
        });
    };
    
    my.isForfeit = function(){
        var user = my.setting_data.move_order;
        var result = my.algorithm.isTerminalNode(my.tiles);
        var max_actions = parseInt(result.moves.max_actions_num);
        var min_actions = parseInt(result.moves.min_actions_num);
        if (user == 1 && max_actions == 0) return true;
        if (user == 0 && min_actions == 0) return true;
        return false;
    };
    
    my.isGameOver = function(max_top_tiles, min_top_tiles){
        var max_tiles = my.tiles.max.length;
        var min_tiles = my.tiles.min.length;
        if (max_tiles == 12 && min_tiles == 12) return false;
        if (max_tiles == 0 || min_tiles == 0) return true;
        
        var result = my.algorithm.isTerminalNode(my.tiles);
        var check_moves = result.moves;
        var max_actions = parseInt(check_moves.max_actions_num);
        var min_actions = parseInt(check_moves.min_actions_num);
        if (max_actions == 0 && min_actions == 0) return true;
        if (max_actions > 0 && max_top_tiles == (my.param.width / 2) && min_actions == 0) return true;
        if (min_actions > 0 && min_top_tiles == (my.param.width / 2) && max_actions == 0) return true;
        return false;
    };
    
    my.moveTileAutomatically = function(player, tiles, game_level){
        $('table.board').block({
            message: '<h5>Johnson is thinking!!</h5>',
            css: {
                color: '#0000ff',
                width: '200px',
                border: '2px solid #c0c0c0'
            }
        });
        setTimeout(function(){
            var result = my.algorithm.runAlphaBetaSearch(player, tiles, game_level);
            if (result.chosen_action != 'none') my.tiles = my.checkerboard.moveTile(player, tiles, result);
            $('table.board').unblock();
            my.computeScore();
        }, 1500);
    };
    
    my.initRecordBoard = function(){
        var user = my.setting_data.move_order;
        var user_name = my.setting_data.nickname;
        var init_value = my.param.width + (my.param.width / 2);
        if (user == 1) {
            $("table.record_table td.max_name").empty().append(user_name);
            $("table.record_table td.min_name").empty().append("Johnson");
        }
        if (user == 0) {
            $("table.record_table td.max_name").empty().append("Johnson");
            $("table.record_table td.min_name").empty().append(user_name);
        }
        $("table.record_table td.max_tiles").empty().append(init_value);
        $("table.record_table td.min_tiles").empty().append(init_value);
        $("table.record_table td.max_score").empty().append(init_value);
        $("table.record_table td.min_score").empty().append(init_value);
    };
    
    my.initial = function(){
        my.checkerboard.initial(my.param);
        my.initialUI();
        my.setButtonListener();
        my.computeScore();
    };
};

// main function
$(document).ready(function(){
    // set up default parameter of the width of checker board and the array of the tile matrix
    var param = new parameter({
        'width': 8
    });
    
    // initiate the object of gamecontroller to start checker game
    $game = new gamecontroller(param);
    $game.initial();
});
