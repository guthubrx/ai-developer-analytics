# CSS Refactoring Plan

## Current Issues

1. **File Duplication**: `main.css` and `main-new.css` are identical
2. **Mixed Architecture**: Custom design system vs VS Code theme variables
3. **Monolithic Structure**: Large CSS files without clear separation
4. **Inconsistent Naming**: Multiple approaches to CSS organization

## Proposed Modular Architecture

```
media/
├── css/
│   ├── base/
│   │   ├── reset.css          # CSS reset
│   │   ├── variables.css      # Design system variables
│   │   └── typography.css     # Font and text styles
│   ├── components/
│   │   ├── layout.css         # Main layout components
│   │   ├── conversation.css   # Message and chat components
│   │   ├── inputs.css         # Form inputs and buttons
│   │   ├── code-blocks.css    # Code display components
│   │   ├── autocomplete.css   # File autocomplete
│   │   └── metrics.css        # Statistics and metrics
│   ├── themes/
│   │   ├── vscode.css         # VS Code theme integration
│   │   └── custom.css         # Custom design system
│   └── main.css               # Main entry point (imports all)
```

## Implementation Steps

### Phase 1: Base Structure
1. Create modular directory structure
2. Extract CSS variables into dedicated file
3. Separate typography and reset styles

### Phase 2: Component Extraction
1. Extract conversation/message components
2. Extract input and form components
3. Extract code block components
4. Extract autocomplete components

### Phase 3: Theme Integration
1. Separate VS Code theme variables
2. Create theme switching mechanism
3. Ensure backward compatibility

### Phase 4: Optimization
1. Remove duplicate files
2. Optimize CSS specificity
3. Add CSS minification for production

## Key Benefits

- **Maintainability**: Clear separation of concerns
- **Reusability**: Component-based architecture
- **Performance**: Reduced CSS duplication
- **Scalability**: Easy to add new components
- **Theming**: Clean theme switching capability

## Migration Strategy

1. **Incremental Migration**: Keep existing files during transition
2. **Feature Flags**: Use CSS imports to switch between old/new
3. **Testing**: Verify all components work in both themes
4. **Cleanup**: Remove old files after successful migration