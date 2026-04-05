import 'package:flutter/material.dart';
import 'selection_border_drawing.dart';

/// A builder that provides the [isResolved] state, which becomes true 
/// only after the [SelectionBorderDrawing] animation has completed.
typedef SynchronizedSelectionBuilder = Widget Function(
  BuildContext context, 
  bool isResolved,
);

/// A reusable wrapper that synchronizes the 'border drawing' animation 
/// with the final 'resolved' state of a selection item.
class SynchronizedSelectionWrapper extends StatefulWidget {
  final bool isSelected;
  final double borderRadius;
  final Color color;
  final SynchronizedSelectionBuilder builder;

  const SynchronizedSelectionWrapper({
    super.key,
    required this.isSelected,
    required this.borderRadius,
    this.color = Colors.white,
    required this.builder,
  });

  @override
  State<SynchronizedSelectionWrapper> createState() => 
      _SynchronizedSelectionWrapperState();
}

class _SynchronizedSelectionWrapperState 
    extends State<SynchronizedSelectionWrapper> {
  bool _isResolved = false;

  @override
  void initState() {
    super.initState();
    // If initially selected, we assume it's already resolved
    if (widget.isSelected) {
      _isResolved = true;
    }
  }

  @override
  void didUpdateWidget(SynchronizedSelectionWrapper oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isSelected && !oldWidget.isSelected) {
      // New selection: wait for animation to resolve
      _isResolved = false;
    } else if (!widget.isSelected && oldWidget.isSelected) {
      // Deselection: reset resolution immediately
      _isResolved = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return SelectionBorderDrawing(
      isSelected: widget.isSelected,
      borderRadius: widget.borderRadius,
      color: widget.color,
      onCompleted: () {
        if (mounted && widget.isSelected) {
          setState(() => _isResolved = true);
        }
      },
      child: widget.builder(context, _isResolved),
    );
  }
}
