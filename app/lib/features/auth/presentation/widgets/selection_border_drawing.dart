import 'dart:ui';
import 'package:flutter/material.dart';

/// A widget that draws a line around its rounded-rectangular border when its
/// [isSelected] state changes from false to true. The line circles once
/// and then fades out.
class SelectionBorderDrawing extends StatefulWidget {
  final Widget child;
  final bool isSelected;
  final double borderRadius;
  final Color color;
  final double strokeWidth;
  final Duration duration;
  final VoidCallback? onCompleted;

  const SelectionBorderDrawing({
    super.key,
    required this.child,
    required this.isSelected,
    this.borderRadius = 32.0,
    this.color = Colors.white,
    this.strokeWidth = 3.0,
    this.duration = const Duration(milliseconds: 800),
    this.onCompleted,
  });

  @override
  State<SelectionBorderDrawing> createState() => _SelectionBorderDrawingState();
}

class _SelectionBorderDrawingState extends State<SelectionBorderDrawing>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _animation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOutQuart,
    );

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        widget.onCompleted?.call();
      }
    });

    if (widget.isSelected) {
      _controller.forward();
    }
  }

  @override
  void didUpdateWidget(SelectionBorderDrawing oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isSelected && !oldWidget.isSelected) {
      _controller.reset();
      _controller.forward();
    } else if (!widget.isSelected && oldWidget.isSelected) {
      _controller.reset();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: AnimatedBuilder(
        animation: _animation,
        builder: (context, child) {
          return CustomPaint(
            foregroundPainter: _BorderPainter(
              progress: _animation.value,
              borderRadius: widget.borderRadius,
              color: widget.color,
              strokeWidth: widget.strokeWidth,
            ),
            child: child,
          );
        },
        child: widget.child,
      ),
    );
  }
}

class _BorderPainter extends CustomPainter {
  final double progress;
  final double borderRadius;
  final Color color;
  final double strokeWidth;

  // Cache path and metrics to avoid re-computing every frame
  static final Map<String, PathMetric> _metricCache = {};

  _BorderPainter({
    required this.progress,
    required this.borderRadius,
    required this.color,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0 || progress >= 1.0) return;

    final opacity = progress < 0.6 ? 1.0 : (1.0 - progress) / 0.4;
    if (opacity <= 0.01) return;

    final paint = Paint()
      ..color = color.withOpacity(opacity.clamp(0.0, 1.0))
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    
    // MaskFilter.blur can be expensive on Android; only use if progress is in active range
    if (opacity > 0.1) {
      paint.maskFilter = const MaskFilter.blur(BlurStyle.normal, 1.2);
    }

    final String cacheKey = '${size.width}-${size.height}-$borderRadius';
    PathMetric? metric = _metricCache[cacheKey];

    if (metric == null) {
      final rect = Offset.zero & size;
      final rrect = RRect.fromRectAndRadius(rect, Radius.circular(borderRadius));
      final path = Path()..addRRect(rrect);
      final metrics = path.computeMetrics().toList();
      if (metrics.isNotEmpty) {
        metric = metrics.first;
        _metricCache[cacheKey] = metric;
      }
    }

    if (metric == null) return;

    final segmentProgress = progress < 0.5 ? progress * 2 : (1.0 - progress) * 2;
    final segmentSize = 0.1 + (segmentProgress * 0.25);

    double end = (progress * (1.0 + segmentSize)).clamp(0.0, 1.0);
    double start = (end - segmentSize).clamp(0.0, 1.0);

    final extractPath = metric.extractPath(
      start * metric.length,
      end * metric.length,
    );

    canvas.drawPath(extractPath, paint);
  }

  @override
  bool shouldRepaint(_BorderPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.borderRadius != borderRadius ||
        oldDelegate.color != color ||
        oldDelegate.strokeWidth != strokeWidth;
  }
}

