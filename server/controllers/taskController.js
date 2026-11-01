const Task = require('../models/Task')
const User = require('../models/User')
const { TASK_STATUSES } = require('../utils/constants')
const {
  isValidId,
  parsePagination,
  pageMeta,
  pick,
  asyncHandler,
} = require('../utils/helpers')

const FIELDS = ['title', 'description', 'dueDate', 'lead', 'company']

exports.createTask = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS)
  data.createdBy = req.user._id
  data.status = 'Pending'

  if (req.user.role === 'admin' && req.body.assignedTo) {
    if (
      !isValidId(req.body.assignedTo) ||
      !(await User.exists({ _id: req.body.assignedTo }))
    ) {
      return res.status(400).json({ message: 'assignedTo user not found' })
    }
    data.assignedTo = req.body.assignedTo
  } else {
    data.assignedTo = req.user._id
  }

  const task = await Task.create(data)
  res.status(201).json(task)
})

exports.getTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query)
  const filter = req.user.role === 'admin' ? {} : { assignedTo: req.user._id }

  if (req.query.status) {
    if (!TASK_STATUSES.includes(req.query.status)) {
      return res
        .status(400)
        .json({ message: `status must be one of: ${TASK_STATUSES.join(', ')}` })
    }
    filter.status = req.query.status
  }

  const [data, total] = await Promise.all([
    Task.find(filter)
      .populate({ path: 'assignedTo', select: 'name email' })
      .populate({ path: 'lead', select: 'name' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ])

  res.json({ data, pagination: pageMeta(total, page, limit) })
})

exports.updateTaskStatus = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id))
    return res.status(400).json({ message: 'Invalid id' })

  const { status } = req.body
  if (!TASK_STATUSES.includes(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${TASK_STATUSES.join(', ')}` })
  }

  const task = await Task.findById(req.params.id)
  if (!task) return res.status(404).json({ message: 'Task not found' })

  // Strict rule: only the assigned user may change status (admins included).
  if (String(task.assignedTo) !== String(req.user._id)) {
    return res
      .status(403)
      .json({ message: 'Only the assigned user can update this task' })
  }

  task.status = status
  await task.save()
  res.json(task)
})
