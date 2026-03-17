// AI Controller System
class AIController {
    constructor(scene, fighter, opponent, difficulty = 'MEDIUM') {
        this.scene = scene;
        this.fighter = fighter;
        this.opponent = opponent;
        this.difficulty = AI_DIFFICULTY[difficulty];
        this.lastDecisionTime = 0;
        this.currentAction = null;
        this.targetPosition = null;
        this.isRecovering = false;
        this.comboCounter = 0;
    }

    update(time, delta) {
        // Check if it's time to make a new decision
        if (time - this.lastDecisionTime < this.difficulty.reactionTime) {
            this.executeCurrentAction();
            return;
        }

        this.lastDecisionTime = time;
        this.makeDecision();
        this.executeCurrentAction();
    }

    makeDecision() {
        const distanceToOpponent = this.getDistanceToOpponent();
        const isOffstage = this.isOffStage();
        const opponentOffstage = this.isOpponentOffStage();

        // Priority 1: Recovery if off stage
        if (isOffstage) {
            this.currentAction = this.planRecovery();
            return;
        }

        // Priority 2: Edge guard if opponent is off stage
        if (opponentOffstage && Math.random() < this.difficulty.aggressiveness) {
            this.currentAction = this.planEdgeGuard();
            return;
        }

        // Priority 3: Combat decisions
        if (distanceToOpponent < 100) {
            this.currentAction = this.planCloseRangeCombat();
        } else if (distanceToOpponent < 250) {
            this.currentAction = this.planMidRangeCombat();
        } else {
            this.currentAction = this.planApproach();
        }
    }

    planRecovery() {
        const stageCenter = { x: GAME_WIDTH / 2, y: 400 };
        const recoverySuccess = Math.random() < this.difficulty.recoverySkill;

        if (!recoverySuccess) {
            // Failed recovery - do something suboptimal
            return { type: 'move', direction: Math.random() > 0.5 ? 1 : -1, jump: Math.random() > 0.3 };
        }

        return {
            type: 'recover',
            targetX: stageCenter.x,
            targetY: stageCenter.y,
            useDoubleJump: this.fighter.canDoubleJump,
            useSpecial: true
        };
    }

    planEdgeGuard() {
        const opponentX = this.opponent.x;
        const edgeX = opponentX < GAME_WIDTH / 2 ? 200 : GAME_WIDTH - 200;

        return {
            type: 'edgeguard',
            targetX: edgeX,
            attack: Math.random() < this.difficulty.accuracy
        };
    }

    planCloseRangeCombat() {
        const shouldAttack = Math.random() < this.difficulty.accuracy;
        const shouldSpecial = Math.random() < this.difficulty.comboAbility * 0.5;
        const shouldDodge = Math.random() > this.difficulty.aggressiveness;

        if (this.opponent.isAttacking && shouldDodge) {
            return {
                type: 'dodge',
                direction: this.fighter.x < this.opponent.x ? -1 : 1
            };
        }

        if (shouldSpecial && this.fighter.specialCooldown <= 0) {
            return {
                type: 'attack',
                attackType: 'special',
                direction: this.fighter.x < this.opponent.x ? 1 : -1
            };
        }

        if (shouldAttack) {
            return {
                type: 'attack',
                attackType: 'normal',
                direction: this.fighter.x < this.opponent.x ? 1 : -1
            };
        }

        return {
            type: 'reposition',
            direction: Math.random() > 0.5 ? 1 : -1
        };
    }

    planMidRangeCombat() {
        const shouldApproach = Math.random() < this.difficulty.aggressiveness;
        const hasRangedAttack = this.fighter.characterData.attacks.special.range > 100;

        if (hasRangedAttack && this.fighter.specialCooldown <= 0 && Math.random() < this.difficulty.accuracy * 0.7) {
            return {
                type: 'attack',
                attackType: 'special',
                direction: this.fighter.x < this.opponent.x ? 1 : -1
            };
        }

        if (shouldApproach) {
            return {
                type: 'approach',
                targetX: this.opponent.x,
                jump: Math.random() > 0.6
            };
        }

        return {
            type: 'wait',
            duration: 200
        };
    }

    planApproach() {
        const shouldDash = Math.random() < this.difficulty.aggressiveness;

        return {
            type: 'approach',
            targetX: this.opponent.x,
            dash: shouldDash,
            jump: this.opponent.y < this.fighter.y - 50
        };
    }

    executeCurrentAction() {
        if (!this.currentAction) return;

        const action = this.currentAction;
        this.fighter.inputState = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            attack: false,
            special: false
        };

        switch (action.type) {
            case 'attack':
                this.fighter.inputState[action.direction > 0 ? 'right' : 'left'] = true;
                if (action.attackType === 'normal') {
                    this.fighter.inputState.attack = true;
                } else {
                    this.fighter.inputState.special = true;
                }
                break;

            case 'approach':
            case 'move':
                if (action.targetX !== undefined) {
                    if (this.fighter.x < action.targetX - 20) {
                        this.fighter.inputState.right = true;
                    } else if (this.fighter.x > action.targetX + 20) {
                        this.fighter.inputState.left = true;
                    }
                } else if (action.direction) {
                    this.fighter.inputState[action.direction > 0 ? 'right' : 'left'] = true;
                }
                if (action.jump) {
                    this.fighter.inputState.jump = true;
                }
                break;

            case 'recover':
                if (this.fighter.x < action.targetX - 30) {
                    this.fighter.inputState.right = true;
                } else if (this.fighter.x > action.targetX + 30) {
                    this.fighter.inputState.left = true;
                }
                this.fighter.inputState.jump = true;
                if (action.useSpecial && this.fighter.body.velocity.y > 0) {
                    this.fighter.inputState.special = true;
                    this.fighter.inputState.up = true;
                }
                break;

            case 'dodge':
                this.fighter.inputState[action.direction > 0 ? 'right' : 'left'] = true;
                this.fighter.inputState.down = true;
                break;

            case 'edgeguard':
                if (Math.abs(this.fighter.x - action.targetX) > 30) {
                    this.fighter.inputState[this.fighter.x < action.targetX ? 'right' : 'left'] = true;
                }
                if (action.attack) {
                    this.fighter.inputState.attack = true;
                }
                break;

            case 'reposition':
                this.fighter.inputState[action.direction > 0 ? 'right' : 'left'] = true;
                break;

            case 'wait':
                // Do nothing
                break;
        }
    }

    getDistanceToOpponent() {
        const dx = this.opponent.x - this.fighter.x;
        const dy = this.opponent.y - this.fighter.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    isOffStage() {
        const arena = this.scene.currentArena;
        const mainPlatform = arena.platforms.find(p => p.type === 'main');
        const leftEdge = mainPlatform.x - mainPlatform.width / 2 - 50;
        const rightEdge = mainPlatform.x + mainPlatform.width / 2 + 50;

        return this.fighter.x < leftEdge || this.fighter.x > rightEdge ||
               this.fighter.y > mainPlatform.y + 100;
    }

    isOpponentOffStage() {
        const arena = this.scene.currentArena;
        const mainPlatform = arena.platforms.find(p => p.type === 'main');
        const leftEdge = mainPlatform.x - mainPlatform.width / 2 - 50;
        const rightEdge = mainPlatform.x + mainPlatform.width / 2 + 50;

        return this.opponent.x < leftEdge || this.opponent.x > rightEdge ||
               this.opponent.y > mainPlatform.y + 100;
    }
}
