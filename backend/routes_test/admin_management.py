from flask import Blueprint, request, jsonify
from app import db, Task, UserCampaign, PartnerCampaign, User
from app import TaskCategory, CampaignStatus # Import Enums
from auth import admin_required
from flask_jwt_extended import jwt_required

admin_management_bp = Blueprint('admin_management_bp', __name__)

# ==============================================================================
# == TASK CRUD ENDPOINTS
# ==============================================================================

@admin_management_bp.route('/tasks', methods=['POST'])
@admin_required()
def create_task():
    """Admin: Creates a new task."""
    data = request.get_json()
    required = ['id', 'icon_name', 'title', 'reward', 'category']
    if not all(k in data for k in required):
        return jsonify({"error": f"Missing required fields: {required}"}), 400

    try:
        category = TaskCategory[data['category'].upper()]
    except KeyError:
        return jsonify({"error": f"Invalid category. Use one of: {[c.name for c in TaskCategory]}"}), 400

    if Task.query.get(data['id']):
        return jsonify({"error": f"Task with id '{data['id']}' already exists"}), 409

    new_task = Task(
        id=data['id'],
        icon_name=data['icon_name'],
        title=data['title'],
        reward=data['reward'],
        category=category,
        mandatory=data.get('mandatory', False),
        link=data.get('link'),
        action=data.get('action')
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify(new_task.to_dict()), 201

@admin_management_bp.route('/tasks', methods=['GET'])
@jwt_required() # Any logged in user can see tasks
def get_all_tasks():
    """Returns a list of all tasks."""
    tasks = Task.query.order_by(Task.category).all()
    return jsonify([task.to_dict() for task in tasks]), 200

@admin_management_bp.route('/tasks/<string:task_id>', methods=['PUT'])
@admin_required()
def update_task(task_id):
    """Admin: Updates an existing task."""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    data = request.get_json()
    task.icon_name = data.get('icon_name', task.icon_name)
    task.title = data.get('title', task.title)
    task.reward = data.get('reward', task.reward)
    task.mandatory = data.get('mandatory', task.mandatory)
    task.link = data.get('link', task.link)
    task.action = data.get('action', task.action)
    
    if 'category' in data:
        try:
            task.category = TaskCategory[data['category'].upper()]
        except KeyError:
            return jsonify({"error": f"Invalid category"}), 400

    db.session.commit()
    return jsonify(task.to_dict()), 200

@admin_management_bp.route('/tasks/<string:task_id>', methods=['DELETE'])
@admin_required()
def delete_task(task_id):
    """Admin: Deletes a task."""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": f"Task '{task_id}' deleted successfully."}), 200


# ==============================================================================
# == USER & PARTNER CAMPAIGN CRUD ENDPOINTS
# ==============================================================================

@admin_management_bp.route('/campaigns', methods=['POST'])
@admin_required()
def create_campaign():
    """
    Admin: Creates either a UserCampaign or a PartnerCampaign.
    The presence of 'requiredLevel' in the JSON body determines the type.
    """
    data = request.get_json()
    required = ['id', 'creator_id', 'link', 'status', 'goal', 'cost', 'category']
    if not all(k in data for k in required):
        return jsonify({"error": f"Missing required fields: {required}"}), 400

    if UserCampaign.query.get(data['id']):
        return jsonify({"error": f"Campaign with id '{data['id']}' already exists"}), 409

    if not User.query.get(data['creator_id']):
        return jsonify({"error": f"Creator user with id {data['creator_id']} not found"}), 404

    try:
        category = TaskCategory[data['category'].upper()]
        status = CampaignStatus[data['status'].upper()]
    except KeyError:
        return jsonify({"error": "Invalid category or status enum value"}), 400

    # Differentiate between Partner and User campaign
    if 'requiredLevel' in data:
        new_campaign = PartnerCampaign(
            id=data['id'],
            creator_id=data['creator_id'],
            link=data['link'],
            status=status,
            goal=data['goal'],
            cost=data['cost'],
            category=category,
            required_level=data['requiredLevel']
        )
    else:
        new_campaign = UserCampaign(
            id=data['id'],
            creator_id=data['creator_id'],
            link=data['link'],
            status=status,
            goal=data['goal'],
            cost=data['cost'],
            category=category
        )
    
    db.session.add(new_campaign)
    db.session.commit()
    return jsonify(new_campaign.to_dict()), 201


@admin_management_bp.route('/campaigns', methods=['GET'])
@jwt_required()
def get_all_campaigns():
    """Returns all campaigns (both User and Partner)."""
    campaigns = UserCampaign.query.order_by(UserCampaign.id).all()
    return jsonify([c.to_dict() for c in campaigns]), 200


@admin_management_bp.route('/campaigns/<string:campaign_id>', methods=['PUT'])
@admin_required()
def update_campaign(campaign_id):
    """Admin: Updates any campaign."""
    campaign = UserCampaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404

    data = request.get_json()
    campaign.link = data.get('link', campaign.link)
    campaign.goal = data.get('goal', campaign.goal)
    campaign.cost = data.get('cost', campaign.cost)
    if 'langs' in data:
        langs = data['langs']
        if not isinstance(langs, list):
            return jsonify({"error": "The 'langs' field must be an array of strings."}), 400
        campaign.langs = langs
        
    
    if 'status' in data:
        campaign.status = CampaignStatus[data['status'].upper()]
    
    # If it's a PartnerCampaign, update the specific field
    if isinstance(campaign, PartnerCampaign) and 'requiredLevel' in data:
        campaign.required_level = data['requiredLevel']
    
    db.session.commit()
    return jsonify(campaign.to_dict()), 200


@admin_management_bp.route('/campaigns/<string:campaign_id>', methods=['DELETE'])
@admin_required()
def delete_campaign(campaign_id):
    """Admin: Deletes a campaign."""
    campaign = UserCampaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404
        
    db.session.delete(campaign)
    db.session.commit()
    return jsonify({"message": f"Campaign '{campaign_id}' deleted successfully."}), 200